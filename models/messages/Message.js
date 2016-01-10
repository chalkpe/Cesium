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

/**
 * @param {User}   params.sender
 * @param {string} params.text
 * @param {number} [params.date]
 */
function Message(params){
    this.sender = params.sender;
    this.text   = params.text;
    this.date   = params.date || Date.now();
}

Message.MIN_SENDING_INTERVAL = 750;
Message.PROHIBITION_PERIOD = 500;

Message.prototype.toString = function(){
    return '[object Message]';
};

module.exports = Message;
