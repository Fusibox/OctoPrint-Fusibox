import tornado.web
import tornado.gen

class StreamHandler(tornado.web.RequestHandler):
    def initialize(self, camera):
        self.camera = camera
    
    @tornado.gen.coroutine
    def get(self, slug):
        self.set_header(
            'Cache-Control', 'no-store, no-cache, must-revalidate, pre-check=0, post-check=0, max-age=0')
        self.set_header('Pragma', 'no-cache')
        self.set_header(
            'Content-Type', 'multipart/x-mixed-replace;boundary=--jpgboundary')
        self.set_header('Connection', 'close')

        my_boundary = "--jpgboundary"
        jpgData = self.camera.get_frame()
        self.write(my_boundary)
        self.write("Content-type: image/jpeg\r\n")
        self.write("Content-length: %s\r\n\r\n" % len(jpgData))
        self.write(jpgData)
        yield self.flush()