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

#!/usr/bin/python
#

#import pycoin
import os
import json
import sys
import random

import hbreq


TESTNET = True
WALLET_ENC_KEY = "123"
API = [
	{ "endpoint": "stats", "method": "GET", "data": False, "replyformat": "json" },
	{ "endpoint": "stats/world", "method": "GET", "data": False, "replyformat": "json" },
	{ "endpoint": "stats/social", "method": "GET", "data": False, "replyformat": "json" },
	{ "endpoint": "auth/state", "method": "GET", "data": False, "replyformat": "json" },
	{ "endpoint": "login", "method": "POST", "data": [{ "email": "%s", "password": "%s" }], "replyformat": "json" },
	{ "endpoint": "signup", "method": "POST", "data": [{ "username": "%s", "email": "%s", "password": "%s", "terms": "%b", "newsletter": "%b" }], "replyformat": "json" },
	{ "endpoint": "me", "method": "GET", "data": False, "replyformat": "json" },
	{ "endpoint": "me", "method": "POST", "data": [{ "firstname": "Gianni"}, {"usertype": "npo"}, {"lastname": "Giangiacomo"}, {"publicfields": [ "firstname", "lastname" ]}, {"location": {"type": "%s", "coordinates": ['long', 'lat']}}], "replyformat": "json" },
	{ "endpoint": "me/media/avatar", "method": "POST", "data": "multipart", "replyformat": "json" },
	{ "endpoint": "me/media/photo", "method": "POST", "data": "multipart", "replyformat": "json" },
	{ "endpoint": "me/events", "method": "GET", "data": False, "replyformat": "json" },
	{ "endpoint": "user/%s", "method": "GET", "data": False, "replyformat": "json" },
	{ "endpoint": "users", "method": "GET", "data": False, "replyformat": "json" },
	{ "endpoint": "media/%s", "method": "GET", "data": False, "replyformat": "image" },
	{ "endpoint": "organizations/list", "method": "GET", "data": False, "replyformat": "json" },
	{ "endpoint": "events/home", "method": "GET", "data": False, "replyformat": "json" },
	{ "endpoint": "events/list", "method": "POST", "data": False, "replyformat": "json" },
	{ "endpoint": "event/%s", "method": "GET", "data": False, "replyformat": "json" },
	{ "endpoint": "event/%s/earthquakes", "method": "GET", "data": False, "replyformat": "json" },
	{ "endpoint": "event/%s/affectedusers", "method": "GET", "data": False, "replyformat": "json" },
	{ "endpoint": "donation/%s", "method": "GET", "data": False, "replyformat": "json" },
	{ "endpoint": "user/%s/donations", "method": "GET", "data": False, "replyformat": "json" },
	{ "endpoint": "event/%s/donations", "method": "GET", "data": False, "replyformat": "json" },
	{ "endpoint": "wallet", "method": "GET", "data": False, "replyformat": "json" },
	{ "endpoint": "wallet/create", "method": "POST", "data": [{"pubkeys": ["%s", "%s"]}], "replyformat": "json" },
	{ "endpoint": "wallet/send", "method": "POST", "data": [{"txhex": "%s", "address": "%s", "donation": "%s"},{"txhex": "%s", "address": "%s"}], "replyformat": "json" },
	{ "endpoint": "wallet/balance/%s", "method": "GET", "data": False, "replyformat": "json" },
	{ "endpoint": "wallet/faucet/%s", "method": "GET", "data": False, "replyformat": "json" }
]



def populate ():
	print 'Running near each event test'
	d = json.loads (hbreq.r ('POST', 'events/list', data={"limit": 5}, token=None)[1].text)['events']
	for e in d[::-1]:
		print e['_id']

		if e['issea']:
			continue

		c = e['affectedcountries'][0].split (' ')[0]
		for x in range (15):
			name = "test" + c + "u" + str(x)

			signup_data = {'username': name, 'email': name+'@gmail.com', 'password': name, "newsletter": False, "terms": True}

			if x % 20 < 10: signup_data ['usertype'] = 'singleuser'
			elif x % 20 < 15: signup_data ['usertype'] = 'npo'
			elif x % 20 < 10: signup_data ['usertype'] = 'park'
			elif x % 20 < 13: signup_data ['usertype'] = 'school'
			elif x % 20 < 15: signup_data ['usertype'] = 'munic'
			elif x % 20 < 17: signup_data ['usertype'] = 'hospital'
			elif x % 20 < 19: signup_data ['usertype'] = 'civilprotection'
			elif x % 20 < 20: signup_data ['usertype'] = 'cultural'
			else: signup_data ['usertype'] = 'singleuser'


			hbreq.r ('POST', 'signup', data=signup_data, token=None)
			r = hbreq.r ('POST', 'login', data={'user': name + '@gmail.com', 'password': name }, token=None)
			d = json.loads (r[1].text)
			t = None
			try:
				t = d['token']
			except:
				print "Error", d
				continue

			lng = e['epicenter']['coordinates'][0] + (random.random () - 0.3)
			lat = e['epicenter']['coordinates'][1] + (random.random () - 0.3)
			hbreq.r('POST', 'me', data={"receiveaddress": "mqw8Pt7N4BbjjfBW551UT5erRweQdeiJsZ", "country": e['affectedcountries'][0], "location": {"type": "Point", "coordinates": [lng,lat]}}, token=t)

			cc = hbreq.r('POST', 'me', data={"operators": '250-1000', "operationfields": { "firstaid": True, "comunication": True, "logistic": False}, "countries": e['affectedcountries']}, token=t)
			print name, cc, signup_data ['usertype']

			r = json.loads (hbreq.r ('GET', 'wallet', data=None, token=t)[1].text)['wallets']
			if len (r) == 0:
				lw = hbreq.r('POST', 'wallet/create', data={"pubkeys": ["026477115981fe981a6918a6297d9803c4dc04f328f22041bedff886bbc2962e01", "02c96db2302d19b43d4c69368babace7854cc84eb9e061cde51cfa77ca4a22b8b9"]}, token=t)

			#print hbreq.r('GET', 'me', token=t)[1].text
	print 'Done'


def populate2 ():
	print 'Running fake population'

	for x in range (500):
		name = "test" + str(x)

		signup_data = {'username': name, 'email': name+'@gmail.com', 'password': name, "newsletter": False, "terms": True, "usertype": "singleuser"}

		hbreq.r ('POST', 'signup', data=signup_data, token=None)
		r = hbreq.r ('POST', 'login', data={'user': name + '@gmail.com', 'password': name }, token=None)
		d = json.loads (r[1].text)
		t = None
		try:
			t = d['token']
		except:
			print "Error", d
			continue
					
		lng = random.random () * 360.0 - 180.0
		lat = random.random () * 160.0 - 80.0
		hbreq.r('POST', 'me', data={"location": {"type": "Point", "coordinates": [lng,lat]}}, token=t)
			
	print 'Done'



def withdraw ():
	print 'Running withdraw near each event test'
	d = json.loads (hbreq.r ('GET', 'events/list', data=None, token=None)[1].text)
	print (d)
	return
	#['events']
	for e in d[::-1]:
		c = e['affectedcountries'][0].split (' ')[0]
		for x in range (10):
			name = c + "User" + str(x)
			r = hbreq.r ('POST', 'login', data={'email': name+'@gmail.com', 'password': name}, token=None)
			d = json.loads (r[1].text)
			t = d['token']

			r = json.loads (hbreq.r ('GET', 'wallet', data=None, token=t)[1].text)['wallets']

 			for x in r:
				# Send value back
				rwb = json.loads (hbreq.r ('GET', 'wallet/balance/'+x['address'], data=None, token=t)[1].text)
				if rwb['balance'] > 0.0:
					pass
				#else:
				#	hbreq.r ('POST', 'wallet/update', data={'address': x['address'], 'delete': True}, token=t)[1].text

	print 'Done'


def cli ():
	try:
		f = open ('token.dat', 'r')
		token = f.read ()
		f.close ()
	except:
		token = None

	try:
		f = open ('wallet.dat', 'r')
		address = f.read ().replace ('\n', '')
		f.close ()
		f = open ('wallets/'+address, 'r')
		wif = f.read ().replace ('\n', '')
		f.close ()

		encpriv = wallet.encrypt (wif, WALLET_ENC_KEY)
		print 'Loaded wallet',address
		print 'WIF:',wif
		print 'Encrypted:',encpriv
		print 'Balance:', wallet.getBalance (TESTNET, address)

	except:
		wif = None
		address = None
		encpriv = None


	while True:
		d = raw_input ('Action (r: request, t: token, q: quit, w: wallet): ')

		if d == 'q':
			sys.exit (0)

		elif d == 'r':
			i = 0

			for x in API:
				print '\t' + str (i) + ') ' + x['method'] + ' - ' + x['endpoint']
				i += 1
			ch = input ('Endpoint: ')
			endpoint = API[ch]['endpoint']

			if endpoint.find ('%s') != -1:
				endpoint = endpoint.replace ('%s', raw_input ('\tEndpoint input: '))

			method = API[ch]['method']

			if API[ch]['data'] != False and API[ch]['data'] == 'multipart':
				fnmulti = raw_input ('\tFilename: ')
				try:
					fmulti = open (fnmulti, 'rb')
				except:
					print '\tUnable to open file', fnmulti
					continue
				ct = raw_input ('\tContent-Type: ')

			elif API[ch]['data'] != False:
				print "\tSelect data format"
				i = 0
				for y in API[ch]['data']:
					print '\t' + str (i) + ') ' + str (y)
					i += 1

				dh = input ('\tSelection: ')
				data = API[ch]['data'][dh]
				for inp in data:
					ins = raw_input ('\t\t'+inp+': ')
					try:
						data [inp] = json.loads (ins)
					except:
						data [inp] = ins
			else:
				data = None

			auth = raw_input ('\tEnable auth (y/n): ') if token != None else 'n'

			if True: #try:
				if API[ch]['data'] == 'multipart':
					res = hbreq.rmp (endpoint, files={'file': (fnmulti, fmulti, ct)}, token=(token if auth == 'y' else None), contenttype=ct)
				else:
					res = hbreq.r (method, endpoint, data=data, token=(token if auth == 'y' else None))

				print 'Status code:', res[0]

				if API[ch]['replyformat'] == 'json':
					print json.dumps (json.loads (res[1].text), sort_keys=True, indent=4, separators=(',', ': '))
				elif API[ch]['replyformat'] == 'image':
					with open('tempimg.png', 'wb') as fd:
						for chunk in res[1].iter_content(32):
							fd.write(chunk)
					f.close ()
					os.system ('feh tempimg.png')
			#except:
			#	print 'Exception on request.'


		elif d == 't':
			token = raw_input('Token: ')
			f = open ('token.dat', 'w')
			f.write (token)
			f.close ()


if __name__ == '__main__':
	if len (sys.argv) < 2:
		cli ()
	else:
		if len (sys.argv) == 3:
			hbreq.setEnv (sys.argv[2])
		
		print 'API url set to:', hbreq.BASE_URL
			
		if sys.argv[1] == 'populate':
			populate ()
		if sys.argv[1] == 'populate2':
			populate2 ()
		if sys.argv[1] == 'withdraw':
			withdraw ()
