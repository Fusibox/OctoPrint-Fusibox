import sys
import random
import logging
testMode = True

if sys.platform != 'win32':
    import board
    import adafruit_dht
    import RPi.GPIO as GPIO
    
    
    GPIO.setmode(GPIO.BCM)

    from picamera import PiCamera
    from Bluetin_Echo import Echo

    testMode = False


class Sensors:
    sensors = None

    def __init__(self, configs):
        self.sensors = configs['sensors']
        self.pin_initialize()

    def pin_initialize(self):
        for name, sensor in self.sensors.items():
            if testMode:
                continue

            '''for name_pin, pin in sensor['pins'].items():
                if name_pin == 'trigger':
                    GPIO.setup(int(pin), GPIO.OUT)
                else:
                    GPIO.setup(int(pin), GPIO.IN)'''
            
            if sensor['type'] == 'HC-SR04':
                self.sensors[name]['object'] = Echo(int(sensor['pins']['trigger']), int(sensor['pins']['echo']), 315)
            
            if sensor['type'] == 'DHT11':
                if not 'object' in self.sensors['temperature']:
                    self.sensors['temperature']['object'] = adafruit_dht.DHT11(getattr(board, 'D' + str(sensor['pins']['0'])), use_pulseio=False)
                    self.sensors['humidity']['object'] = self.sensors['temperature']['object']
                    
                if not 'object' in self.sensors['humidity']:
                    self.sensors['temperature']['object'] = adafruit_dht.DHT11(getattr(board, 'D' + str(sensor['pins']['0'])), use_pulseio=False)
                    self.sensors['humidity']['object'] = self.sensors['temperature']['object']
                    
    def read(self, name):
        if self.sensors[name]['type'] == 'HC-SR04':
            if testMode:
                data = random.randint(0, 30)
            else:
                data = self.sensors[name]['object'].read('cm', 5)
            
            self.sensors[name]['value'] = data
            return data
        
        if self.sensors[name]['type'] == 'DHT11':
            data = ''
            if testMode:
                data = random.randint(20, 65)
            elif 'object' in self.sensors[name]:
                if name == 'temperature':
                    data = self.sensors[name]['object'].temperature
                else:
                    data = self.sensors[name]['object'].humidity

            self.sensors[name]['value'] = data
            return data
