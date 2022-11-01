import os
import octoprint.plugin

from json import dumps
from flask import render_template, Response, request, render_template, jsonify, send_file
from .modules import app, streamHandler
from .configs import configs
from datetime import datetime

class FusiBoxPlugin(octoprint.plugin.StartupPlugin, 
                    octoprint.plugin.TemplatePlugin, 
                    octoprint.plugin.SettingsPlugin,
                    octoprint.plugin.AssetPlugin,
                    octoprint.plugin.BlueprintPlugin):
    
    def __init__(self, configs):
        self.basepath = os.path.dirname(os.path.abspath(__file__))
        self.app = app.App(configs, self.basepath)
        
    def is_blueprint_csrf_protected(self):
        return True
    
    @octoprint.plugin.BlueprintPlugin.route('/audio', methods=['GET'])
    def audio_get(self):
        return render_template('fusibox_audio.html')
    
    @octoprint.plugin.BlueprintPlugin.route('/audio/start', methods=['GET'])
    def audio_start(self):
        self.app.microphone.recording = True
        return { 'result': True }
    
    @octoprint.plugin.BlueprintPlugin.route('/audio/stop', methods=['GET'])
    def audio_stop(self):
        self.app.microphone.recording = False
        return { 'result': True, 'file': self.app.microphone.file_name }
    
    @octoprint.plugin.BlueprintPlugin.route('/image/feed', methods=['GET'])
    def image_feed(self):
        now = datetime.now().strftime("%Y-%m-%d-%H-%M-%S")
        file_name = self.app.configs['settings']['image_prefix']['value'] + '-' + now + '.jpg'
        with open(self.basepath + '/files/image/' + file_name, 'wb') as f:
            f.write(self.app.camera.get_image())
        return send_file(self.basepath + '/files/image/' + file_name, as_attachment=True)
    
    @octoprint.plugin.BlueprintPlugin.route('/video/start', methods=['GET'])
    def video_start(self):
        self.app.camera.recording = True
        return { 'result': True }
    
    @octoprint.plugin.BlueprintPlugin.route('/video/stop', methods=['GET'])
    def video_stop(self):
        self.app.camera.recording = False
        return { 'result': True, 'file': self.app.camera.file_name }
    
    @octoprint.plugin.BlueprintPlugin.route('/file', methods=['GET'])
    def file_get(self):
        file_name = request.args.get('name');
        file_type = request.args.get('type');
        
        if not file_type in ['image', 'video', 'audio'] or not os.path.exists(self.basepath + '/files/' + file_type + '/' + file_name):
            return {'result': False}
        
        return send_file(self.basepath + '/files/' + file_type + '/' + file_name, as_attachment=True)
        
    @octoprint.plugin.BlueprintPlugin.route('/file/list', methods=['GET'])
    def file_list(self):
        images = os.listdir(self.basepath + '/files/image')
        audios = os.listdir(self.basepath + '/files/audio')
        videos = os.listdir(self.basepath + '/files/video')
        
        images.sort(reverse=True);
        audios.sort(reverse=True);
        videos.sort(reverse=True);
        
        images = [{ 'name': x, 'size': round(os.path.getsize(self.basepath + '/files/image/' + x) / 1024, 2) } for x in images if not x in ['1.jpg', '2.jpg', '3.jpg'] and '.jpg' in x]
        audios = [{ 'name': x, 'size': round(os.path.getsize(self.basepath + '/files/audio/' + x) / 1024, 2) } for x in audios if '.wav' in x]
        videos = [{ 'name': x, 'size': round(os.path.getsize(self.basepath + '/files/video/' + x) / 1024, 2) } for x in videos if '.avi' in x]
        
        response = jsonify({
            'images': images,
            'audios': audios,
            'videos': videos
        })
        return response
        
    @octoprint.plugin.BlueprintPlugin.route('/file/delete', methods=['POST'])
    def file_delete(self):
        files = request.get_json()
        if files is None or not 'files' in files:
            return Response('Files not found', status = 400)
        
        for file in files['files']:
            file_type = file['type']
            file_name = file['name']
            os.unlink(self.basepath + '/files/' + file_type + '/' + file_name)
        
        return {'result': True}
    
    @octoprint.plugin.BlueprintPlugin.route('/sensors', methods=['GET'])
    def sensors_get(self):
        configs2 = self.app.configs.copy()
        configs2 = {
            'sensors': {
                'temperature': {
                    'value': configs2['sensors']['temperature']['value']
                },
                'humidity': {
                    'value': configs2['sensors']['humidity']['value']
                },
                'distance': {
                    'value': configs2['sensors']['distance']['value']
                }
            }
        }
        
        response = 'sensors**' + dumps({i: j for i,j in configs2['sensors'].items()})
        self._plugin_manager.send_plugin_message(self._identifier, response)
        return ''
    
    @octoprint.plugin.BlueprintPlugin.route('/outputs', methods=['GET'])
    def outputs_get(self):
        response = 'outputs**' + dumps({i: j for i,j in self.app.configs['outputs'].items()})
        self._plugin_manager.send_plugin_message(self._identifier, response)
        return ''
    
    @octoprint.plugin.BlueprintPlugin.route('/settings', methods=['GET'])
    def settings_get(self):
        response = 'settings**' + dumps({i: j for i,j in self.app.configs['settings'].items()})
        self._plugin_manager.send_plugin_message(self._identifier, response)
        return ''
    
    @octoprint.plugin.BlueprintPlugin.route('/settings', methods=['POST'])
    def settings_post(self):
        data = request.get_json()
        key = list(data.keys())[0]
        value = list(data.values())[0]

        if key in self.app.configs['settings']:
            self._logger.info('Changing ' + key + ' configurations')
            if value == '':
                self._plugin_manager.send_plugin_message(self._identifier, self.app.configs['settings'][key]['value'])
                return ''
            else:
                for name, val in value.items():
                    self.app.configs['settings'][key][name] = val
                    
        return ''
    
    def on_after_startup(self):
        self._settings.set(['videoRecording'], False)
        self._settings.set(['audioRecording'], False)
        self._settings.save()
        
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
                
        self._plugin_manager.send_plugin_message(self._identifier, dict(type='error', msg='Invalid JSON for Webhooks OAUTH DATA Settings'))


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
            imagePrefix='fusibox-image',
            videoRecording=False,
            audioRecording=False
        )

    def get_template_configs(self):
        return [
            dict(type='navbar', custom_bindings=False),
            dict(type='settings', custom_bindings=False)
        ]
        
    def get_assets(self):
        return dict(
            js=['js/fusibox.js'],
            css=['css/fusibox.css']
        )

    def on_startup(self, host, port):
        pass
        
    def route_hook(self, server_routes, *args, **kwargs):
        return [
            (r'/video/feed/(.*)', streamHandler.StreamHandler, { 'camera': self.app.camera })
        ]

__plugin_name__ = 'FusiBox'
__plugin_pythoncompat__ = '>=3.6'

def __plugin_load__():
    global __plugin_implementation__
    global __plugin_hooks__
    
    __plugin_implementation__ = FusiBoxPlugin(configs)
    __plugin_hooks__ = {
        'octoprint.server.http.routes': __plugin_implementation__.route_hook
    }