"""Regression for compact mobile navigation, based on the reviewed browser screenshots."""
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from pathlib import Path
from threading import Thread
import os
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
class Quiet(SimpleHTTPRequestHandler):
    def log_message(self,*args): pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(root)))
Thread(target=server.serve_forever,daemon=True).start()
try:
    with sync_playwright() as p:
        options={'headless':True}
        if os.environ.get('CHROMIUM_PATH'): options['executable_path']=os.environ['CHROMIUM_PATH']
        browser=p.chromium.launch(**options)
        page=browser.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
        page.goto(f'http://127.0.0.1:{server.server_port}/?tab=growth')
        page.wait_for_function('window.AISG_GROWTH_PEOPLE_BRIDGE?.getAllGoals().length===108 && history.state?.aisgReflection===1')
        page.wait_for_timeout(500)
        height=page.locator('.app-header').bounding_box()['height']
        assert height<260, f'Mobile header unexpectedly tall: {height}px'
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'), 'Horizontal document overflow'
        output=root/'test-results';output.mkdir(exist_ok=True)
        page.screenshot(path=str(output/'mobile-top-verified.png'))
        print(f'PASS: compact mobile header {height:.1f}px and no horizontal overflow')
        browser.close()
finally:
    server.shutdown()
