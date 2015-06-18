#!/usr/bin/env python
# -*- coding: utf-8 -*-

from flask import Flask, request, render_template
from flask.ext.sqlalchemy import SQLAlchemy
from werkzeug import secure_filename
import sys
import os.path
from pprint import pprint
import string
import random

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///test.db'
db = SQLAlchemy(app)

dumppath = 'static/dump/'


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
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


class FileVotes(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(500), unique=True)
    votes = db.Column(db.Integer, default=0)

    def __init__(self, filename, votes=0):
        self.filename = filename
        self.votes = votes

    def __repr__(self):
        return '%s : %d' (self.filename, self.votes)


@app.route('/')
def default_view():
    return render_template('index.jinja2')


@app.route('/votes', methods=['POST'])
def votes():
    data = request.get_json()
    try:
        daFile = FileVotes.query.filter(FileVotes.filename == data.get('filename')).one()
    except NoResultFound:
        return '{"d": {"error": "Filename not found"} }', 400
    daFile.votes += 1
    db.session.add(daFile)
    db.session.commit()
    return '{"d": {"vote": %d} }' % daFile.votes


@app.route('/files', methods=['GET', 'POST'])
def files():
    db_files = {}
    for i in FileVotes.query.all():
        if not os.path.isfile(dumppath + i.filename):
            db.session.delete(i)
            db.session.flush()
        else:
            db_files[i.filename] = i.votes
    if request.method == 'POST':
        f = request.files['file']
        pprint(f)
        name = secure_filename(f.filename)
        if not os.path.isfile(dumppath + name):
            f.save(dumppath + name)
            size = os.path.getsize(dumppath + name)
            db.session.add(FileVotes(name, 0))
            db.session.commit()
            return '{"d": {"name": "/static/dump/%s", "size": %d, "votes": 0} }' % (name, size)
        else:
            db.session.commit()
            return '{"d": {"error": "exists"} }', 400
    if request.method == 'GET':
	result = []
	for entry in os.listdir(dumppath):
            if os.path.isfile(dumppath + entry):
		votes = None
		size = os.path.getsize(dumppath + entry)
                if entry in db_files:
                    votes = db_files[entry]
                else:
                    votes = 0
                    newFile = FileVotes(entry, 0)
                    db.session.add(newFile)
                    db.session.flush()
		result.append('{"name": "/static/dump/%s", "size": %d, "votes": %d}' % (entry, size, votes))
        db.session.commit()
        return '{"d": [%s] }' % ','.join(result)


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
        app.run()

