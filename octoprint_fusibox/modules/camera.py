import sys
import cv2
import numpy
import shutil
import base64

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
    last_frame = 0
    video_writer = None
    file_name = ''
    
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
                self.file_name = self.configs['settings']['video_prefix']['value'] + '-' + now + '.avi'
                self.video_writer = cv2.VideoWriter(self.basepath + '/files/video/' + self.file_name, cv2.VideoWriter_fourcc('M','J','P','G'), 7.5, (width, height))
            
            if (time() - self.last_frame) > (1/30):
                self.video_writer.write(self.frame2)
                self.last_frame = time()
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
                cls.frame = [
                    base64.decodebytes(b'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'),
                    base64.decodebytes(b'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'),
                    base64.decodebytes(b'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')
                ][int(time()) % 3]
                
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
            cls.camera.resolution = (640, 480)
            cls.camera.hflip = True
            cls.camera.vflip = True
            cls.camera.framerate = 30
            cls.camera.start_preview()
            sleep(1)

            stream = BytesIO()
            for foo in cls.camera.capture_continuous(stream, 'jpeg', use_video_port = True):
                stream.seek(0)

                cls.frame = stream.read()
                
                stream.seek(0)
                stream.truncate(0)
                
                cls.recording_routine()
                
                if time() - cls.last_access > 10:
                    if cls.recording:
                        cls.video_writer.release()
                        cls.video_writer = None
                        cls.recording = False
                    break

        cls.thread = None
