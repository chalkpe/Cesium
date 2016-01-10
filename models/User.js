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
 * @param {Socket} params.socket
 * @param {string} params.nickname
 * @param {string} params.color
 */
function User(params){
    this.socket   = params.socket;
    this.address  = params.socket.request.connection.remoteAddress;
    this.nickname = params.nickname.trim();
    this.color    = params.color || null;

    this.plasteredCount = 0;
    this.lastMessage = null;
    this.lastCommand = null;
}

User.prototype.toString = function(){
    return '[object User]';
};

User.prototype.toJSON = function(){
    return {
        address: this.address, nickname: this.nickname, color: this.color
    };
}

module.exports = User;
