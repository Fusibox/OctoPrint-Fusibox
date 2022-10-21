from datetime import datetime

def fans(*args):
    sensors = args[1]
    configs = args[2]
    outputs = args[3]

    mode = configs['settings']['fan_mode']['value']
    value = configs['settings']['fan_value']['value']
    fan_1 = configs['settings']['fan_1']['value']
    fan_2 = configs['settings']['fan_2']['value']
    timeout = configs['settings']['fan_timeout']
    schedule = configs['settings']['fan_schedule']
    temperature = configs['settings']['fan_temperature']

    actual_date = datetime.now().strftime('%Y-%m-%d')
    actual_weekday = datetime.today().weekday()

    if mode == 'manual':
        if value != '':
            if int(fan_1): outputs.write('fan_1', value)
            if int(fan_2): outputs.write('fan_2', value)

    if mode == 'schedule':
        if str(actual_weekday) in [str(i) for i in schedule['days']]:
            start_date = datetime.strptime(actual_date + ' ' + schedule['start'], '%Y-%m-%d %H:%M')
            end_date = datetime.strptime(actual_date + ' ' + schedule['end'] + ':59', '%Y-%m-%d %H:%M:%S')

            if datetime.now() >= start_date and datetime.now() <= end_date:
                if int(fan_1): outputs.write('fan_1', 1)
                if int(fan_2): outputs.write('fan_2', 1)
            else:
                outputs.write('fan_1', 0)
                outputs.write('fan_2', 0)
        else:
            outputs.write('fan_1', 0)
            outputs.write('fan_2', 0)

    if 'temperature' in sensors and mode == 'temperature':
        temp = sensors['temperature']
        if float(temp) >= int(temperature['min']) and float(temp) <= int(temperature['max']):
            outputs.write('fan_1', 0)
            outputs.write('fan_2', 0)
        else:
            if int(fan_1): outputs.write('fan_1', 1)
            if int(fan_2): outputs.write('fan_2', 1) 

    if mode == 'timer':
        if 'started' in timeout and float(timeout['started']) > 0:
            if (datetime.now().timestamp() - float(timeout['started'])) <= (int(timeout['value']) / 1000):
                if int(fan_1): outputs.write('fan_1', 1)
                if int(fan_2): outputs.write('fan_2', 1)
            else:
                outputs.write('fan_1', 0)
                outputs.write('fan_2', 0)
    elif 'started' in timeout: 
        del timeout['started']

    
def lights(*args):
    sensors = args[1]
    configs = args[2]
    outputs = args[3]

    mode = configs['settings']['panel_mode']['value']
    value = configs['settings']['panel_value']['value']
    camera = configs['settings']['panel_camera']
    timeout = configs['settings']['panel_timeout']
    distance = configs['settings']['panel_distance']
    result = 1

    outputs.write('led_blue', configs['settings']['camera']['value'])
    outputs.write('led_green', configs['settings']['mic']['value'])

    if mode == 'manual':
        if value != '':
            outputs.write('led_panel', value)
            result = value

    if 'distance' in sensors and mode == 'distance':
        dis = sensors['distance']
        min_value = distance['value'].split('-')[0]
        max_value = distance['value'].split('-')[1]

        if float(dis) >= int(min_value) and float(dis) <= int(max_value):
            outputs.write('led_panel', 1)
            result = 1
            distance['started'] = datetime.now().timestamp()

        if 'started' in distance:
            if (datetime.now().timestamp() - float(distance['started'])) > (int(timeout['value']) / 1000):
                outputs.write('led_panel', 0)
                result = 0
        else:
            outputs.write('led_panel', 0)
            result = 0

    elif 'started' in distance: 
        del distance['started']

    if str(camera['value']) == '1':
        outputs.write('led_panel', 1 if str(configs['settings']['camera']['value']) == '1' else result)

def relays(*args):
    configs = args[2]
    outputs = args[3]

    mode = configs['settings']['relay_mode']['value']
    value = configs['settings']['relay_value']['value']
    timeout = configs['settings']['relay_timeout']
    schedule = configs['settings']['relay_schedule']

    actual_date = datetime.now().strftime('%Y-%m-%d')
    actual_weekday = datetime.today().weekday()

    if mode == 'manual':
        if value != '':
            outputs.write('relay_1', value)

    if mode == 'schedule':
        if str(actual_weekday) in [str(i) for i in schedule['days']]:
            start_date = datetime.strptime(actual_date + ' ' + schedule['start'], '%Y-%m-%d %H:%M')
            end_date = datetime.strptime(actual_date + ' ' + schedule['end'] + ':59', '%Y-%m-%d %H:%M:%S')

            if datetime.now() >= start_date and datetime.now() <= end_date:
                outputs.write('relay_1', 1)
            else:
                outputs.write('relay_1', 0)
        else:
            outputs.write('relay_1', 0)

    if mode == 'timer':
        if 'started' in timeout and float(timeout['started']) > 0:
            if (datetime.now().timestamp() - float(timeout['started'])) <= (int(timeout['value']) / 1000):
                outputs.write('relay_1', 1)
            else:
                outputs.write('relay_1', 0)
    elif 'started' in timeout: 
        del timeout['started']


def sensors(*args):
    data = args[1]
    configs = args[2]
    sensors = args[3]

    for name in sensors.sensors.keys():
        if not name in data:
            data[name] = 0
        
        try:
            data[name] = sensors.read(name)
            configs['sensors'][name]['value'] = data[name]
        except:
            pass
