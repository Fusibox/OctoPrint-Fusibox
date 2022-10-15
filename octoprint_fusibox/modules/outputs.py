import sys
import random
import logging
testMode = True

if sys.platform != 'win32':
    import RPi.GPIO as GPIO
    GPIO.setmode(GPIO.BCM)

    from picamera import PiCamera
    from Bluetin_Echo import Echo

    testMode = False

class Outputs:
    outputs = None

    def __init__(self, configs):
        self.outputs = configs['outputs']
        self.pin_initialize()

    def pin_initialize(self):
        for name, config in self.outputs.items():
            if testMode:
                # print('OUTPUT ' + name, config['pin'], config['initial_value'])
                continue

            GPIO.setup(int(config['pin']), GPIO.OUT)
            GPIO.output(int(config['pin']), GPIO.HIGH if config['initial_value'] == 1 else GPIO.LOW)

    def write(self, name, level, pwm = False):
        if testMode:
            # print('OUTPUT ' + name, level)
            pass
        else:
            if pwm:
                if not 'pwm' in self.outputs[name]:
                    self.outputs[name]['pwm'] = GPIO.PWM(int(self.outputs[name]['pin']), 1000)
                    self.outputs[name]['pwm'].start(int(level))
                else:
                    self.outputs[name]['pwm'].ChangeDutyCycle(int(level))
            else:
                GPIO.output(int(self.outputs[name]['pin']), GPIO.HIGH if int(level) else GPIO.LOW)

        self.outputs[name]['value'] = level
