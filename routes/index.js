/*
 * Copyright (C) 2015-2016  ChalkPE
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

var express = require('express');
var router = express.Router();

var path = require('path');
var fs = require('fs');

var hash = "";
fs.readFile(path.join(__dirname, '..', '.git', 'refs', 'heads', 'master'), 'utf-8', function(error, data){
    if(error) throw error;
    hash = data.toString();
});

router.get('/', function(req, res, next){
    res.render('index', {
        req: req, title: 'Cesium', version: '0.0.1',
        hash: hash, repo: 'github.com/ChalkPE/Cesium'
    });
});

module.exports = router;
