#!/usr/bin/env python
# -*- coding: utf-8 -*-

from flask import Flask, request, render_template
from flask.ext.sqlalchemy import SQLAlchemy
from sqlalchemy.orm.exc import NoResultFound
from werkzeug.utils import secure_filename
import sys
import os.path
from pprint import pprint
import random
import ujson

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///test.db'
db = SQLAlchemy(app)

# This path must be relative to this file, and the user running app.py must have read/write permission,
# but defaults to under /static if you want app.py to serve the files
dumppath = 'static/dump/'
dumplinkpath = '/%s' % dumppath
sizelimit = 1024 * 1024 * 100  # number of MBs, defaulting at 100MB

class User(db.Model):
    user_id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True)
    email = db.Column(db.String(120), unique=True)
    pin = db.Column(db.String(40))

    def __init__(self, username, email, pin=None):
        self.username = username
        self.email = email
        self.pin = pin
        if self.pin is None:
            self.pin = ''.join(random.choice('0123456789') for i in range(5))

    def __repr__(self):
        return '<User %r>' % self.username


class Vote(db.Model):
    vote_id = db.Column(db.Integer, primary_key=True)
    filename_id = db.Column(db.Integer, db.ForeignKey('filename.file_id'))
    user_id = db.Column(db.Integer, db.ForeignKey('user.user_id'))

    def __init__(self, filename_id, user_id):
        self.filename_id = filename_id
        self.user_id = user_id

    def __repr__(self):
        return '%d : %d' % (self.filename_id, self.user_id)

class Filename(db.Model):
    file_id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(500), unique=True)

    def __init__(self, filename):
        self.filename = filename

    def __repr__(self):
        return '<Filename: %s>' % (self.filename)


@app.route('/')
def default_view():
    return render_template('index.jinja2', dumplinkpath=dumplinkpath)


@app.route('/votes', methods=['POST'])
def votes_view():
    data = request.get_json()
    try:
        da_file = Filename.query.filter(Filename.filename == data.get('filename')).one()
    except NoResultFound:
        return '{"d": {"error": "Filename not found"} }', 400
    try:
        da_user = User.query.filter(User.username == data.get('username')).filter(User.pin == data.get('pin')).one()
        da_vote = Vote.query.filter(Vote.filename_id == da_file.file_id).filter(Vote.user_id == da_user.user_id).count()
    except NoResultFound:
        return '{"d": {"error": "User not found"} }', 400
    if da_vote == 0:
        db.session.add(Vote(da_file.file_id, da_user.user_id))
        db.session.commit()
    return '{"d": {"votes": %d} }' % Vote.query.filter(Vote.filename_id == da_file.file_id).count()


@app.route('/config', methods=['GET'])
def config_view():
    result = {'d': {
        'dumplinkpath': dumplinkpath,
        'sizelimit': sizelimit
    }}
    return ujson.encode(result)


@app.route('/login', methods=['POST'])
def login_view():
    data = request.get_json()
    try:
        User.query.filter(User.username == data.get('username')).filter(User.pin == data.get('pin')).one()
    except NoResultFound:
        return '{"d": {"error": "User not found"} }', 400
    return '{"d": true }'


@app.route('/files', methods=['GET', 'POST'])
def files_view():
    db_files = {}
    for i in Filename.query.all():
        if not os.path.isfile(dumppath + i.filename):
            votes = Vote.query.filter(Vote.filename_id == i.file_id).all()
            for vote in votes:
                db.session.delete(vote)
            db.session.delete(i)
            db.session.flush()
        else:
            db_files[i.filename] = Vote.query.filter(Vote.filename_id == i.file_id).count()
    if request.method == 'POST':
        f = request.files['file']
        pprint(f)
        name = secure_filename(f.filename)
        if not os.path.isfile(dumppath + name):
            f.save(dumppath + name)
            size = os.path.getsize(dumppath + name)
            dbfile = Filename(name)
            db.session.add(dbfile)
            db.session.flush()
            db.session.commit()
            return '{"d": {"name": "%s", "size": %d, "votes": 0} }' % (name, size)
        else:
            db.session.commit()
            return '{"d": {"error": "exists"} }', 400
    if request.method == 'GET':
        result = []
        for entry in os.listdir(dumppath):
            if os.path.isfile(dumppath + entry):
                size = os.path.getsize(dumppath + entry)
                if entry in db_files:
                    fvotes = db_files[entry]
                else:
                    fvotes = 0
                    new_file = Filename(entry)
                    db.session.add(new_file)
                    db.session.flush()
                result.append('{"name": "%s", "size": %d, "votes": %d}' % (entry, size, fvotes))
        db.session.commit()
        return '{"d": [%s] }' % ','.join(result)

@app.after_request
def add_header(response):
    response.cache_control.max_age = 30
    return response

def main():
    action = sys.argv[1]
    if action not in ['default', 'usage']:
        print('please use a valid command')
        exit()
    if action == 'usage':
        print('Usage: this is not helpful right now, but you are loved!')
        exit()
    if action == 'default':
        db.drop_all()
        db.create_all()
        admin = User('admin', 'admin@example.com', '23456')
        db.session.add(admin)
        db.session.commit()
        print('Admin created')


if __name__ == "__main__":
    if len(sys.argv) > 1:
        main()
    else:
        app.debug = True
        app.testing = True
        app.run(host='0.0.0.0', port=5000)

