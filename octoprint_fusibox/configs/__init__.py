configs = {
    'sensors': {
        'temperature': {
            'pins': {
                0: '4'
            },
            'type': 'DHT11'
        },
        'humidity': {
            'pins': {
                0: '4'
            },
            'type': 'DHT11'
        },
        'distance': {
            'pins': {
                'trigger': 23,
                'echo': 24
            },
            'type': 'HC-SR04'
        }
    },
    'outputs': {
        'led_red': {
            'pin': 16,
            'value': 0,
            'initial_value': 1,
            'type': 'led'
        },
        'led_green': {
            'pin':25,
            'value': 0,
            'initial_value': 0,
            'type': 'led'
        },
        'led_blue': {
            'pin':21,
            'value': 0,
            'initial_value': 0,
            'type': 'led'
        },
        'led_panel': {
            'pin':13,
            'value': 0,
            'initial_value': 0,
            'type': 'led'
        },
        'relay_1': {
            'pin': 26,
            'value': 1,
            'initial_value': 1,
            'type': 'relay'
        },
        'fan_1': {
            'pin': 6,
            'value': 0,
            'initial_value': 0,
            'type': 'fan'
        },
        'fan_2': {
            'pin': 12,
            'value': 0,
            'initial_value': 0,
            'type': 'fan'
        }
    },
    'settings': {
        'panel_camera': {
            'initial_value': 1,
            'value': 1,
            'options': [0, 1]
        },
        'panel_distance': {
            'initial_value': '0-10',
            'value': '0-10',
            'options': ['0-10', '10-20']
        },
        'panel_timeout': {
            'initial_value': 3000,
            'value': 3000
        },
        'panel_value': {
            'initial_value': 0,
            'value': 0
        },
        'panel_mode': {
            'initial_value': 'manual',
            'value': 'manual',
            'options': ['manual', 'distance']
        },
        'relay_value': {
            'initial_value': 1,
            'value': 1
        },
        'relay_schedule': {
            'start': '00:00',
            'end': '23:59',
            'days': [0, 1, 2, 3, 4, 5, 6]
        },
        'relay_timeout': {
            'initial_value': 3000,
            'value': 3000
        },
        'relay_mode': {
            'initial_value': 'manual',
            'value': 'manual',
            'options': ['manual', 'schedule', 'timer']
        },
        'fan_value': {
            'initial_value': 0,
            'value': 0
        },
        'fan_temperature': {
            'min': 0,
            'max': 70
        },
        'fan_schedule': {
            'start': '00:00',
            'end': '23:59',
            'days': [0, 1, 2, 3, 4, 5, 6]
        },
        'fan_timeout': {
            'initial_value': 3000,
            'value': 3000
        },
        'fan_mode': {
            'initial_value': 'manual',
            'value': 'manual',
            'options': ['manual', 'temperature', 'schedule', 'timer']
        },
        'fan_1': {
            'value': 1
        },
        'fan_2': {
            'value': 1
        },
        'camera': {
            'value': 0,
        },
        'mic': {
            'value': 0,
        },
        'temperature': {
            'value': 0
        },
        'distance': {
            'value': 0
        },
        'humidity': {
            'value': 0
        },
        'video_prefix': {
            'value': 'fusibox-video'
        },
        'image_prefix': {
            'value': 'fusibox-image'
        },
        'audio_prefix': {
            'value': 'fusibox-audio'
        }
    }
}
