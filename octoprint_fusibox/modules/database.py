from json import dumps, loads
from sqlite3 import connect

class Database:
    connected = False
    file_name = 'db.db'
    instance = None
    cursor = None

    def __init__(self, basepath):
        self.connection = None
        self.file_path = basepath + '/database/' + self.file_name

    def initialize(self):
        if not self.connected:
            self.connect()

        sql = '''
            PRAGMA foreign_keys=off;
            BEGIN TRANSACTION;
                CREATE TABLE IF NOT EXISTS "sensors" (
                    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                    "name" TEXT UNIQUE NOT NULL,
                    "type" TEXT NOT NULL,
                    "value" BOOL NOT NULL,
                    "pins" TEXT NOT NULL,
                    "active" BOOL NOT NULL
                );
                
                CREATE TABLE IF NOT EXISTS "outputs" (
                    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                    "name" TEXT NOT NULL,
                    "type" TEXT NOT NULL,
                    "value" INTEGER NOT NULL,
                    "initial_value" INTEGER NOT NULL,
                    "pin" TEXT NOT NULL,
                    "active" BOOL NOT NULL
                );

                CREATE TABLE IF NOT EXISTS "settings" (
                    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                    "name" TEXT UNIQUE NOT NULL,
                    "value" TEXT NOT NULL,
                    "options" TEXT NOT NULL,
                    "initial_value" TEXT NOT NULL,
                    "active" BOOL NOT NULL
                );
            COMMIT;
            PRAGMA foreign_keys=on;
        '''

        self.cursor.executescript(sql)
        self.instance.close()
        self.connected = False

    def select(self, query):
        if not self.connected:
            self.connect()
        
        self.cursor.execute(query)
        data = self.cursor.fetchall()
        self.instance.close()
        self.connected = False

        return data

    def insert(self, table, value):
        if not self.connected:
            self.connect()
        
        columns = list(value.keys())
        values = list(value.values())
        query = 'INSERT INTO ' + table + '(' + ','.join(columns) + ') VALUES(' + ','.join(['?'] * len(values)) + ')'

        self.cursor.execute(query, values)
        self.instance.commit()
        self.instance.close()
        self.connected = False

        return self.cursor.lastrowid

    def update(self, table, value):
        if not self.connected:
            self.connect()
        
        id = value['id']
        del value['id']
        columns = list(value.keys())
        values = list(value.values())
        values.append(id)
        query = 'UPDATE ' + table + ' SET ' + ','.join([str(a) + ' = ?' for a in columns]) + ' WHERE id = ?'

        self.cursor.execute(query, values)
        self.instance.commit()
        self.instance.close()
        self.connected = False

    def connect(self):
        try:
            self.instance = connect(self.file_path)
            self.cursor = self.instance.cursor()
            self.connected = True
        except:
            self.connected = False
            
    def sincronize_settings(self, configs, just_update = False):
        if not just_update:
            db_sensors = self.select('SELECT * FROM sensors;')
            db_settings = self.select('SELECT * FROM settings;')
            db_outputs = self.select('SELECT * FROM outputs;')

            sensors_saved = [];
            for sensor in db_sensors:
                if not sensor[1] in configs['sensors']:
                    self.update('sensors', {
                        'active': 0,
                        'id': sensor[0]
                    })
                else:
                    configs['sensors'][sensor[1]]['id'] = sensor[0]
                    configs['sensors'][sensor[1]]['type'] = sensor[2]
                    configs['sensors'][sensor[1]]['value'] = sensor[3]
                    configs['sensors'][sensor[1]]['pins'] = loads(sensor[4])
                    configs['sensors'][sensor[1]]['active'] = sensor[5]
                
                sensors_saved.append(sensor[1])

            settings_saved = [];
            for setting in db_settings:
                if not setting[1] in configs['settings']:
                    self.update('settings', {
                        'active': 0,
                        'id': setting[0]
                    })
                else:
                    value = setting[2]
                    try:
                        value = loads(setting[2])
                    except:
                        pass
                    
                    if type(value) is dict:
                        for name, val in value.items():
                            configs['settings'][setting[1]][name] = val
                    else:
                        configs['settings'][setting[1]]['id'] = setting[0]
                        configs['settings'][setting[1]]['value'] = setting[2]
                        configs['settings'][setting[1]]['options'] = loads(setting[3]) if len(setting[3]) else ''
                        configs['settings'][setting[1]]['initial_value'] = setting[4]
                        configs['settings'][setting[1]]['active'] = setting[5]
                
                settings_saved.append(setting[1])

            outputs_saved = [];
            for output in db_outputs:
                if not output[1] in configs['outputs']:
                    self.update('outputs', {
                        'active': 0,
                        'id': output[0]
                    })
                else:
                    configs['outputs'][output[1]]['id'] = output[0]
                    configs['outputs'][output[1]]['type'] = output[2]
                    configs['outputs'][output[1]]['value'] = output[3]
                    configs['outputs'][output[1]]['initial_value'] = output[4]
                    configs['outputs'][output[1]]['pin'] = output[5]
                    configs['outputs'][output[1]]['active'] = output[6]
                
                outputs_saved.append(output[1])
            
        for name, config in configs['sensors'].items():
            if not just_update and not name in sensors_saved:
                id = self.insert('sensors', {
                    'name': name,
                    'type': config['type'],
                    'value': '',
                    'pins': dumps(config['pins']),
                    'active': 1
                })

                configs['sensors'][name]['id'] = id
            elif 'id' in configs['sensors'][name] and 'value' in configs['sensors'][name] and config['value']:
                self.update('sensors', {
                    'id': config['id'],
                    'value':  config['value']
                })
            
        for name, config in configs['settings'].items():
            if not just_update and not name in settings_saved:
                id = self.insert('settings', {
                    'name': name,
                    'value': config['value'] if 'value' in config else dumps(config),
                    'options': dumps(config['options']) if 'options' in config else '',
                    'initial_value': config['initial_value'] if 'initial_value' in config else '',
                    'active': 1
                })

                configs['settings'][name]['id'] = id
            elif 'id' in configs['settings'][name]:
                self.update('settings', {
                    'id': config['id'],
                    'value': config['value'] if 'value' in config else dumps(config)
                })
            
        for name, config in configs['outputs'].items():
            if not just_update and not name in outputs_saved:
                id = self.insert('outputs', {
                    'name': name,
                    'type': config['type'],
                    'value': config['value'],
                    'initial_value': config['initial_value'],
                    'pin': config['pin'],
                    'active': 1
                })

                configs['outputs'][name]['id'] = id
            elif 'id' in configs['outputs'][name]:
                self.update('outputs', {
                    'id': config['id'],
                    'value': config['value']
                })