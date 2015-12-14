koc-api
=======

Web API for the online MMORPG Kings of Chaos.<br>
A demo is running at http://koc-api.herokuapp.com/api/ (not warranty, might be down/broken).<br>
http://koc-api.herokuapp.com/api/battlefield/1<br>
http://koc-api.herokuapp.com/api/stats/3512693

This is the Web Server component of a set of 3 libraries as shown in below diagram:

[koc-ionic](../../../koc-ionic)<br />
[koc-api](../../../koc-api)<br />
[node-koc](../../../node-koc)<br />

![Relations between the libraries](http://i.imgur.com/pbDEWd2.png "Relations between the libraries")

Usage
-----

### Register
**Path:**   /api/register<br>
**Method:** POST<br>
**Data:**<br>
  username<br>
  password<br>
  email<br>
  race<br>
  challenge<br>
  challenge_response<br>

TODO
