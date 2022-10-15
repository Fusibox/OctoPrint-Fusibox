from distutils.command.config import config
import os
import sys
import shutil
basepath = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(1, basepath)
    
import services
import octoprint.plugin

from flask import Flask, render_template, Response, send_file, jsonify, request, make_response
from configs import configs
from datetime import datetime
from flask_cors import CORS
from modules.jobs import Jobs
from modules.i2smic import run
from modules.camera import Camera
from modules.outputs import Outputs
from modules.sensors import Sensors
from modules.database import Database
from modules.microphone import Microphone

try:
    with open("/etc/modprobe.d/snd-i2smic-rpi.conf") as f:
        if not "options snd-i2smic-rpi rpi_platform_generation=2" in f.read():
            run()
except:
    pass

class App():
    configs = {}
    
    def __init__(self, configs):
        self.configs = configs
        
        # Flask Web Server
        self.camera = Camera(self.configs, basepath)
        self.microphone = Microphone(self.configs, basepath)
        self.app = Flask(__name__, static_folder='./public')
        CORS(self.app)

        @self.app.route('/audio', methods=['GET'])
        def audio_get():
            return render_template('fusibox_audio.html')

        @self.app.route('/video', methods=['GET'])
        def video_get():
            return render_template('fusibox_video.html')

        @self.app.route('/video-feed', methods=['GET'])
        def video_feed():
            return Response(self.camera.gen(), mimetype = 'multipart/x-mixed-replace; boundary=frame')

        @self.app.route('/video/recording/start', methods=['GET'])
        def video_start():
            self.camera.recording = True
            return { 'result': True }
        
        @self.app.route('/video/recording/stop', methods=['GET'])
        def video_stop():
            self.camera.recording = False
            return { 'result': True, 'file': self.camera.video_file_name }
        
        @self.app.route('/image-feed', methods=['GET'])
        def image_feed():
            now = datetime.now().strftime("%d-%m-%Y-%H-%M-%S")
            file_name = self.configs['settings']['image_prefix']['value'] + '-' + now + '.jpg'
            with open(basepath + '/files/image/' + file_name, 'wb') as f:
                f.write(self.camera.get_image())
            return send_file(basepath + '/files/image/' + file_name, as_attachment=True)
        
        @self.app.route('/file', methods=['GET'])
        def file_get():
            file_name = request.args.get('name');
            file_type = request.args.get('type');
            
            if not file_type in ['image', 'video', 'audio'] or not os.path.exists(basepath + '/files/' + file_type + '/' + file_name):
                response = jsonify({"result": False})
                response.headers.add('Access-Control-Allow-Origin', '*')
                return response
            
            return send_file(basepath + '/files/' + file_type + '/' + file_name, as_attachment=True)
        
        @self.app.route('/files/delete', methods=['POST'])
        def file_delete():
            files = request.get_json()
            if not 'files' in files:
                return Response('Files not found', status = 400)
            
            for file in files['files']:
                file_type = file['type']
                file_name = file['name']
                os.unlink(basepath + '/files/' + file_type + '/' + file_name)
            
            return {"result": True}

        @self.app.route('/audio-feed', methods=['GET'])
        def audio_feed():
            return Response(self.microphone.gen())
        
        @self.app.route('/audio/recording/start', methods=['GET'])
        def audio_start():
            self.microphone.recording = True
            return { 'result': True }
        
        @self.app.route('/audio/recording/stop', methods=['GET'])
        def audio_stop():
            self.microphone.recording = False
            return { 'result': True, 'file': self.microphone.file_name }
        
        @self.app.route('/files/list', methods=['GET'])
        def file_list():
            images = os.listdir(basepath + '/files/image')
            audios = os.listdir(basepath + '/files/audio')
            videos = os.listdir(basepath + '/files/video')
            
            images.sort(reverse=True);
            audios.sort(reverse=True);
            videos.sort(reverse=True);
            
            images = [{ 'name': x, 'size': round(os.path.getsize(basepath + '/files/image/' + x) / 1024, 2) } for x in images if not x in ['1.jpg', '2.jpg', '3.jpg']]
            audios = [{ 'name': x, 'size': round(os.path.getsize(basepath + '/files/audio/' + x) / 1024, 2) } for x in audios]
            videos = [{ 'name': x, 'size': round(os.path.getsize(basepath + '/files/video/' + x) / 1024, 2) } for x in videos]
            
            response = jsonify({
                "images": images,
                "audios": audios,
                "videos": videos
            })
            return response
        
        @self.app.route('/device/disk', methods=['GET'])
        def disk_free():
            total, used, free = shutil.disk_usage("/")
            response = jsonify({
                "total": total / float(1<<20),
                "used": used / float(1<<20),
                "free": free / float(1<<20)
            })
            return response

        def web_server(*args):
            args[1].run(host = '0.0.0.0', port=8000, debug = False, threaded = True)

        self.db = Database(basepath)
        self.db.initialize()
        self.db.sincronize_settings(self.configs)

        def sincronize_database(*args):
            self.db.sincronize_settings(args[1], True)

        self.data = {}
        self.outputs = Outputs(self.configs)
        self.sensors = Sensors(self.configs)

        jobs = Jobs()
        jobs.new(web_server, 'WebServer', 1, [self.app]).execute()
        jobs.new(services.fans, 'Fans', 1, [self.data, self.configs, self.outputs]).execute()
        jobs.new(services.lights, 'Lights', 1, [self.data, self.configs, self.outputs]).execute()
        jobs.new(services.relays, 'Relays', 1, [self.data, self.configs, self.outputs]).execute()
        jobs.new(services.sensors, 'Sensors', 1, [self.data, self.configs, self.sensors]).execute()
        jobs.new(services.websocket, 'WebSocket', 1, [self.configs]).execute()
        jobs.new(sincronize_database, 'SincronizeDatabase', 1, [self.configs]).execute()

class FusiBoxPlugin(octoprint.plugin.StartupPlugin, 
                    octoprint.plugin.TemplatePlugin, 
                    octoprint.plugin.SettingsPlugin,
                    octoprint.plugin.AssetPlugin):
    app = None
    
    def __init__(self, configs):
        self.app = App(configs)
    
    def on_after_startup(self):
        self._logger.info(__file__)
        self._logger.info("HELLO! I'm working right now... (more: %s)" % self._settings.get(["url"]))
        
    def on_settings_initialized(self):
        pass
        
    def on_settings_save(self, data):
        octoprint.plugin.SettingsPlugin.on_settings_save(self, data)
        settings = self.app.configs['settings']
        internal_names = {
            'panelCamera': 'panel_camera',
            'fan1': 'fan_1',
            'fan2': 'fan_2',
            'panelMode': 'panel_mode',
            'panelDistance': 'panel_distance',
            'panelTimeout': 'panel_timeout',
            'relayMode': 'relay_mode',
            'relay': 'relay_schedule',
            'relayTimeout': 'relay_timeout',
            'fanMode': 'fan_mode',
            'fanTemperatureMax': 'fan_temperature',
            'fan': 'fan_schedule',
            'fanTimeout': 'fan_timeout',
            'videoPrefix': 'video_prefix',
            'audioPrefix': 'audio_prefix',
            'imagePrefix': 'image_prefix',
        }
        
        week_days = { 'Mon': 0, 'Tue': 1, 'Wed': 2, 'Thu': 3, 'Fri': 4, 'Sat': 5, 'Sun': 6 }        
        
        for k, v in data.items():
            if 'ScheduleTime' in k:
                settings[internal_names[k.split('ScheduleTime')[0]]][k.split('ScheduleTime')[1].lower()] = v
            elif 'ScheduleDay' in k:
                week_day = week_days[k.split('ScheduleDay')[1]]
                key = k.split('ScheduleDay')[0]
                if v:
                    if not week_day in settings[internal_names[key]]['days']:
                        settings[internal_names[key]]['days'].append(week_day)
                else:
                    settings[internal_names[key]]['days'] = [x for x in settings[internal_names[key]]['days'] if x != week_day]
                    
            elif k == 'fanTemperatureMax':
                 settings[internal_names[k]]['max'] = int(v)
            else:
                settings[internal_names[k]]['value'] = v if not type(v) is bool else int(v)

    def get_settings_defaults(self):
        return dict(
            panelCamera=True,
            panelMode='manual',
            panelDistance='0-10',
            panelTimeout='3000',
            relayMode='manual',
            relayScheduleTimeStart='00:00',
            relayScheduleTimeEnd='23:59',
            relayScheduleDayMon=True,
            relayScheduleDayTue=True,
            relayScheduleDayWed=True,
            relayScheduleDayThu=True,
            relayScheduleDayFri=True,
            relayScheduleDaySat=True,
            relayScheduleDaySun=True,
            relayTimeout=3000,
            fanMode='manual',
            fanTemperatureMax=70,
            fanScheduleTimeStart='00:00',
            fanScheduleTimeEnd='23:59',
            fanScheduleDayMon=True,
            fanScheduleDayTue=True,
            fanScheduleDayWed=True,
            fanScheduleDayThu=True,
            fanScheduleDayFri=True,
            fanScheduleDaySat=True,
            fanScheduleDaySun=True,
            fanTimeout=3000,
            fan1=True,
            fan2=True,
            videoPrefix='fusibox-video',
            audioPrefix='fusibox-audio',
            imagePrefix='fusibox-image'
        )

    def get_template_configs(self):
        return [
            dict(type="navbar", custom_bindings=False),
            dict(type="settings", custom_bindings=False)
        ]
        
    def get_assets(self):
        return dict(
            js=["js/fusibox.js"],
            css=["css/fusibox.css"]
        )

__plugin_name__ = "FusiBox"
__plugin_pythoncompat__ = ">=3.6"
__plugin_implementation__ = FusiBoxPlugin(configs)