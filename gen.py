#!/usr/bin/env python3
import os
from time import sleep
from glob import glob
from shutil import copytree, rmtree, ignore_patterns

from jinja2 import Environment, FileSystemLoader, select_autoescape
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

env = Environment(
    loader=FileSystemLoader(['examples', 'templates']),
    autoescape=select_autoescape(['html']),
)


class Handler(FileSystemEventHandler):

    @staticmethod
    def build_project():
        print('BUILDING PROJECT')
        rmtree('build', ignore_errors=True)
        print('static', '...')
        static_path = os.path.join('build', 'static')
        copytree(
            'static', 
            static_path, 
            ignore=ignore_patterns('*~', '.*'),
        )

        for filepath in glob('examples/*.html'):
            print(filepath, '...')
            name = os.path.basename(filepath)
            template = env.get_template(name)
            output = template.render()
            output_path = os.path.join('build', name)
            with open(output_path, 'w') as fp:
                fp.write(output)

    def dispatch(self, event=None):
        sleep(1)
        self.build_project()


if __name__ == "__main__":
    handler = Handler()
    handler.build_project()
    observer = Observer()

    for directory in ['examples', 'templates', 'static']:
        observer.schedule(handler, directory, recursive=True)
    observer.start()

    try:
        while True:
            sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()
