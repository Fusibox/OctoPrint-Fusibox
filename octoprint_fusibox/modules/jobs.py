import os
from uuid import uuid4
from threading import Thread, Event

class Job(Thread):
    fn = lambda a : a
    time = 2
    event = None

    def __init__(self, name, fn, time = 1, args = []):
        self.fn = fn
        self.time = time
        super(Job, self).__init__(name=name, target=self._wrapper, args=([self] + args))
        self.event = Event()

    def _wrapper(self, *args):
        while not self.isStopped():
            self.fn(*args)
            self.event.wait(self.time)

    def stop(self):
        self.event.set()
        return self
        
    def execute(self):
        self.setDaemon(True)
        self.start()
        return self

    def isStopped(self):
        return self.event.is_set()


class Jobs:
    jobs = {}

    def new(self, fn, name = '', time = 1, args = []):
        if name == '':
            name = uuid4().hex

        self.jobs[name] = Job(name, fn, time, args)
        return self.jobs[name]

    def start(self, name):
        self.jobs[name].setDaemon(True)
        return self.jobs[name].start()

    def stop(self, name):
        return self.jobs[name].stop()

    def watch(self):
        while len(self.jobs) > 0:
            try:
                [t.join(1) for t in self.jobs.values() if t is not None and t.is_alive()]
            except KeyboardInterrupt:
                [self.stop(name) for name in self.jobs]
                print('Finishing all jobs...')
                os._exit(0)