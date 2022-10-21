import sys
import cv2
import numpy
import shutil

from io import BytesIO
from time import time, sleep
from datetime import datetime
from threading import Thread

if sys.platform != 'win32':
    from picamera import PiCamera

class Camera(object):
    thread = None
    frame = None
    last_access = 0
    camera = None
    recording = False
    video_writer = None
    video_file_name = ''
    
    def __init__(self, configs, basepath):
        self.configs = configs
        self.basepath = basepath
        pass

    def initialize(self):
        if self.thread is None:
            self.thread = Thread(target=self._thread, args=([self]))
            self.thread.start()

            while self.frame is None:
                sleep(0)

    def get_frame(self):
        self.last_access = time()
        self.initialize()
        return self.frame

    def gen(self):
        while True:
            frame = self.get_frame()
            yield (b'--frame\r\n'
                b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
            
    def get_image(self):
        return self.get_frame()

    def recording_routine(self):
        if self.recording:
            total, used, free = shutil.disk_usage("/")
            if (free / float(1<<20)) < 500:
                self.recording = False
                return
            
            nparr = numpy.fromstring(self.frame, numpy.uint8)
            self.frame2 = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            height, width, layers = self.frame2.shape
            
            if not self.video_writer:
                print('Starting the recording')
                now = datetime.now().strftime("%Y-%m-%d-%H-%M-%S")
                self.video_file_name = self.configs['settings']['video_prefix']['value'] + '-' + now + '.avi'
                self.video_writer = cv2.VideoWriter(self.basepath + '/files/video/' + self.video_file_name, cv2.VideoWriter_fourcc('M','J','P','G'), 2, (width, height))
            
            self.video_writer.write(self.frame2)
        else:
            if self.video_writer:
                print('Stopping the recording')
                self.video_writer.release()
                self.video_writer = None

    @classmethod
    def _thread(*args):
        cls = args[1]
        
        if sys.platform == 'win32':
            cls.video = None
            while True:
                cls.frame = [open('C:/Octoprint/venv/Lib/site-packages/octoprint/plugins/fusibox/files/image/' + f + '.jpg', 'rb').read() for f in ['1', '2', '3']][int(time()) % 3]
                
                cls.recording_routine()        
            
                if time() - cls.last_access > 10:
                    if cls.recording:
                        cls.video_writer.release()
                        cls.video_writer = None
                        cls.recording = False
                    break
                
                sleep(0.5)
                
            cls.thread = None
            return
        
        with PiCamera() as cls.camera:
            cls.camera.resolution = (320, 240)
            cls.camera.hflip = True
            cls.camera.vflip = True
            cls.camera.start_preview()
            sleep(1)

            stream = BytesIO()
            for foo in cls.camera.capture_continuous(stream, 'jpeg', use_video_port = True):
                stream.seek(0)

                cls.frame = stream.read()
                
                stream.seek(0)
                stream.truncate()
                
                cls.recording_routine()
                
                if time() - cls.last_access > 10:
                    if cls.recording:
                        cls.video_writer.release()
                        cls.video_writer = None
                        cls.recording = False
                    break

        cls.thread = None
