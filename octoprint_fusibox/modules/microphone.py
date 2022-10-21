import wave
import shutil

from time import time
from pyaudio import paInt16, PyAudio
from datetime import datetime

class Microphone(object):
    bits = 16
    rate = 44100
    audio = None
    chunk = 1024
    frames = []
    configs = None
    channels = 1
    basepath = None
    recording = False
    file_name = ''
    wave_object = None
    
    def __init__(self, configs, basepath):
        self.configs = configs
        self.basepath = basepath

    def gen(self):
        self.audio = PyAudio()
        wav_header = self.gen_header()
        stream = self.audio.open(
            format = paInt16,
            channels = self.channels,
            rate = self.rate,
            input = True,
            frames_per_buffer = self.chunk
        )
        
        first_run = True
        while True:
            self.frame = stream.read(self.chunk)
            
            if first_run:
                yield(wav_header + self.frame)
                first_run = False
            else:
                yield(self.frame)
            
            if self.recording:
                total, used, free = shutil.disk_usage("/")
                if (free / float(1<<20)) < 500:
                    self.recording = False
                    continue
                
                if not self.wave_object:
                    self.frames = []
                    now = datetime.now().strftime("%Y-%m-%d-%H-%M-%S")
                    self.file_name = self.configs['settings']['audio_prefix']['value'] + '-' + now + '.wav'
                    
                self.wave_object = wave.open(self.basepath + '/files/audio/' + self.file_name, 'wb')
                self.wave_object.setnchannels(self.channels)
                self.wave_object.setsampwidth(self.audio.get_sample_size(paInt16))
                self.wave_object.setframerate(self.rate)
                    
                
                self.frames.append(self.frame)
                self.wave_object.writeframes(b''.join(self.frames))
                self.wave_object.close()
            else:
                self.frames = []
                self.wave_object = None
        
    def gen_header(self, data_size = 2000):
        data_size = data_size * 10 ** 6
        o = bytes('RIFF','ascii')
        o += (data_size + 36).to_bytes(4, 'little')
        o += bytes('WAVE', 'ascii')
        o += bytes('fmt ', 'ascii')
        o += (16).to_bytes(4, 'little')
        o += (1).to_bytes(2, 'little')
        o += (self.channels).to_bytes(2, 'little')
        o += (self.rate).to_bytes(4, 'little')
        o += (self.rate * self.channels * self.bits // 8).to_bytes(4, 'little')
        o += (self.channels * self.bits // 8).to_bytes(2, 'little')
        o += (self.bits).to_bytes(2, 'little')
        o += bytes('data', 'ascii')
        o += (data_size).to_bytes(4, 'little')
        return o
