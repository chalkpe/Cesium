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

var mongoose = require('mongoose');
var User = require('../models/User');

var TwitterStrategy  = require('passport-twitter').Strategy;
var passportConfig = require('../config/passport');

module.exports = function(passport){
    passport.serializeUser((user, done) => done(null, user.id));
    passport.deserializeUser((id, done) => User.find({ id: id }, (err, user) => done(err, user)));

    passport.use(new TwitterStrategy(passportConfig, (token, tokenSecret, profile, done) => process.nextTick(() => User.findOne({ 'id': profile.id }, (err, user) => {
        if(err) return done(err);
        if(user) return done(null, user);
        else {
            var newUser = new User({
                id: profile.id, token: token,
                username: profile.username, displayName: profile.displayName
            });
            newUser.save(err => done(err, newUser));
        }
    }))));
};
