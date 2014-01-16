ITCBrowserAutomation
====================

A PhantomJS script to automate the creation of new apps and versions in iTunesConnect from the command line. It uses a simple state machine and named states to keep track of where the script is on the site.

This script requires PhantomJS. This is a work in progress. It's not complete yet, but should serve as a starting point or example for interacting with the iTunes Connect web interface programmatically.

To execute, simply call phantomjs on the commandline and pass it the itcautomate.js script as the first argument. You can then pass the app name, version, bundleid and sku in via the -a -v -b and -s arguments which are read into JavaScript variables by the script.

Example: ./phantomjs itcautomate.js -v 1.2.3 -s my.app.sku -a "Le App Name" -b com.example.bundleid