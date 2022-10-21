from . import services
from .jobs import Jobs
from .camera import Camera
from .outputs import Outputs
from .sensors import Sensors
from .database import Database
from .microphone import Microphone

class App():
    pcs = set()
    configs = {}
    
    def __init__(self, configs, basepath):
        self.configs = configs
        self.basepath = basepath
        
        self.camera = Camera(self.configs, self.basepath)
        self.microphone = Microphone(self.configs, self.basepath)
        
        self.db = Database(self.basepath)
        self.db.initialize()
        self.db.sincronize_settings(self.configs)

        def sincronize_database(*args):
            self.db.sincronize_settings(args[1], True)

        self.data = {}
        self.outputs = Outputs(self.configs)
        self.sensors = Sensors(self.configs)

        jobs = Jobs()
        jobs.new(services.fans, 'Fans', 1, [self.data, self.configs, self.outputs]).execute()
        jobs.new(services.lights, 'Lights', 1, [self.data, self.configs, self.outputs]).execute()
        jobs.new(services.relays, 'Relays', 1, [self.data, self.configs, self.outputs]).execute()
        jobs.new(services.sensors, 'Sensors', 1, [self.data, self.configs, self.sensors]).execute()
        jobs.new(sincronize_database, 'SincronizeDatabase', 1, [self.configs]).execute()
