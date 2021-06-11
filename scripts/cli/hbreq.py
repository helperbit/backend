"""
 Helperbit: a p2p donation platform (backend)
 Copyright (C) 2016-2021  Davide Gessa (gessadavide@gmail.com)
 Copyright (C) 2016-2021  Helperbit team
 
 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.
 
 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.
 
 You should have received a copy of the GNU General Public License
 along with this program.  If not, see <https://www.gnu.org/licenses/>
"""

import json
import requests

BASE_URL = "http://localhost"
BASE_PORT = 3000
BASE_API = "/api/v1/"
BASE_PARAM = ""

def setEnv (env):
	global BASE_URL, BASE_PORT
	
	BASE_URL = "http://localhost"
	BASE_PORT = 3000

def rget (endpoint, headers = None):
	r = requests.get (BASE_URL + ':' + str (BASE_PORT) + BASE_API + endpoint + BASE_PARAM, headers = headers)
	return (r.status_code, r)


def rpost (endpoint, data = None, headers = None):
	r = requests.post (BASE_URL + ':' + str (BASE_PORT) + BASE_API + endpoint + BASE_PARAM, headers = headers, data = data)
	return (r.status_code, r)

def rmp (endpoint, files, token, contenttype):
	headers = { 'Authorization': 'Bearer ' + token }
	r = requests.post (BASE_URL + ':' + str (BASE_PORT) + BASE_API + endpoint + BASE_PARAM, headers = headers, files=files)
	return (r.status_code, r)

def r (method, endpoint, data = None, token = None):
	if token != None:
		headers = { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json', 'X-Auth-Token': 'staff66' }
	else:
		headers = { 'Content-Type': 'application/json', 'X-Auth-Token': 'staff66' }

	if method.upper () == 'GET':
		return rget (endpoint, headers = headers)
	elif method.upper () == 'POST':
		return rpost (endpoint, data = json.dumps (data), headers = headers)
