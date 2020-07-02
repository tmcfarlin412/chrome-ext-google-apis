/*

Copyright 2018 Gerald McFarlin

This file is part of "Chrome Extension Core"

"Chrome Extension Core" is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

"Chrome Extension Core" is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with "Chrome Extension Core".  If not, see <https://www.gnu.org/licenses/>.

*/

const Core = {}

// Constants
Core.IS_CONTENT_SCRIPT = true
Core.LOG_LEVEL_INFO = false
Core.LOG_LEVEL_DEBUG = false
Core.LOG_LEVEL_TEST = false
Core.LOG_STACK_TRACE = false

Core.LOG_TO_LOCAL_STORAGE = false;
Core.LOG_KEY = "LOG_KEY";

Core._LOG_DEFAULT = "start new log"
Core._LOG_LENGTH_MAX = 200000

Core._init = function() {
    Core._logChain = Core.getStorageLocal(Core.LOG_KEY, Core._LOG_DEFAULT)
}

// Helpers

Core.copyToClipboard = function(text) {
    const el = document.createElement('textarea');
    el.value = text;
    el.setAttribute('readonly', '');
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el); 
}

Core.mailto = function(email, subject, body) {
    return encodeURI('mailto:' + email + '?subject=' + subject + '&body=' + body)
}

/**
 * 
 * @param {Boolean} ifCheckVariable Variable to check before alerting with an 'if' check
 * @param {String} alertMessage Message to display
 * @param {String} localStorageKey Key to store last alert time at
 * @param {Number} delayBetweenAlerts Min delay between alerting user if the check succeeds
 */
Core.alertIfVariable = function (ifCheckVariable, alertMessage, localStorageKey, delayBetweenAlerts) {
    if (ifCheckVariable) {
        Core.getStorageLocal(localStorageKey, 0)
            .then(_lastDebuggingAlertTime => {
                if (Date.now() - delayBetweenAlerts > _lastDebuggingAlertTime) {
                    alert(alertMessage)
                    return Core.setStorageLocal(localStorageKey, Date.now())
                } else {
                    // No need to alert
                }
            })
    } else {
        Core.removeStorageLocal(localStorageKey)
    }
}

Core.currentTimeNice = function () {
    return Core.timeNice(new Date())
}

Core.timeNice = function (date) {
    var hours = date.getHours()
    var amPm = 'AM'
    if (hours == 0) {
        hours = 12
    } else if (hours == 12) {
        amPm = 'PM'
    } else if (hours > 12) {
        hours = hours - 12
        amPm = 'PM'
    }
    return (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear() + ' ' + hours + ':' + Core.formatNumber(date.getMinutes(), 2) + ':' + Core.formatNumber(date.getSeconds(), 2) + ' ' + amPm
}

Core.formatNumber = function (value, digits) {
    var zeros = ""
    var i = 0
    while (i < digits) {
        zeros = zeros + "0"
        i++
    }
    return (zeros + value).slice(-digits);
}

/**
 * Converts html markup into node
 * @param {String} html 
 */
Core.elementFromHtml = function (html) {
    var template = document.createElement('template');
    template.innerHTML = html.trim();
    return template.content.firstChild;
}

// Local Storage

/**
 * Returns Promise to retrieve the value in chrome.storage.local, creates entry and returns defaultValue if non-existent
 * @param {String} key 
 * @param {*} defaultValue defaults to {} if not provided
 */
Core.getStorageLocal = function (key, defaultValue) {
    if (defaultValue == undefined) {
        defaultValue = {}
    }
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(key, (result) => {
            if (chrome.runtime.lastError) {
                Core.logi(chrome.runtime.lastError);
                reject(chrome.runtime.lastError.message)
            } else if (!result[key]) {
                chrome.storage.local.set({ key: defaultValue }, () => {
                    if (chrome.runtime.lastError) {
                        Core.logi(chrome.runtime.lastError);
                    } else {
                        resolve(defaultValue)
                    }
                })
            } else {
                resolve(result[key])
            }
        })
    })
}

/**
 * Returns Promise to set local storage key/value 
 * @param {String} key 
 * @param {*} value 
 */
Core.setStorageLocal = function (key, value) {
    return new Promise((resolve, reject) => {
        var keyValuePair = {}
        keyValuePair[key] = value
        chrome.storage.local.set(keyValuePair, () => {
            if (chrome.runtime.lastError) {
                Core.logd(chrome.runtime.lastError);
                reject(chrome.runtime.lastError.message)
            } else {
                resolve(value)
            }
        })
    })
}

Core.removeStorageLocal = function (key) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.remove(key, () => {
            if (chrome.runtime.lastError) {
                Core.logd(chrome.runtime.lastError);
                reject(chrome.runtime.lastError.message)
            } else {
                resolve()
            }
        })
    })
}


// Logging

Core._getCallerLine = function (depth) {
    try {
        throw Error('')
    } catch (err) {
        var caller_lines = err.stack.split("\n");
        depth = depth ? depth : caller_lines.length
        var trace = ''
        for (let i = 1; i < depth; i++) {
            const line = caller_lines[i];
            var index = line.indexOf("at ");
            trace = trace + (trace.length > 0 ? '\n' : '')
            trace = trace + line.slice(index + 2, line.length);
        }

        return trace
    }
}

Core.getLog = function () {
    return Core._logChain;
}

Core.clearLog = function () {
    return Core._logChain = Core._logChain
        .then(_log => Core.setStorageLocal(Core.LOG_KEY, Core._LOG_DEFAULT))
}

Core._appendLog = function(s) {
    return Core._logChain = Core._logChain
        .then(_log => {
            if (s.length + _log.length > Core._LOG_LENGTH_MAX) {
                const chopCount = s.length + _log.length - Core._LOG_LENGTH_MAX;
                return Core.setStorageLocal(Core.LOG_KEY, _log.substr(chopCount, _log.length - chopCount) + s);
            } else {
                return Core.setStorageLocal(Core.LOG_KEY, _log + s);
            }
        })
}

Core.log = function () {
    Array.prototype.unshift.call(arguments, Core.currentTimeNice());
    if (Core.LOG_STACK_TRACE) {
        Array.prototype.push.call(arguments, Core._getCallerLine());
    }
    console.log.apply(null, arguments);
    if (Core.LOG_TO_LOCAL_STORAGE) {
        let logLine = '';
        for (let index = 0; index < arguments.length; index++) {
            const element = arguments[index];
            if (index != 0) {
                logLine += "|";
            }
            if (typeof element == 'string') {
                logLine += element;
            } else {
                logLine += JSON.stringify(element);
            }
        }
        
        Core._appendLog('\n' + logLine)
    }
}

/**
 * Log info about what's going on (likely to clog up the console)
 */
Core.logd = function () {
    if (Core.LOG_LEVEL_DEBUG) {
        Array.prototype.unshift.call(arguments, 'DEBUG');
        Core.log.apply(null, arguments);
    }
}

/**
 * Log info about what's going on (likely to clog up the console)
 */
Core.logi = function () {
    if (Core.LOG_LEVEL_INFO) {
        Array.prototype.unshift.call(arguments, 'INFO');
        Core.log.apply(null, arguments);
    }
}

Core.logt = function () {
    if (Core.LOG_LEVEL_TEST) {
        Array.prototype.unshift.call(arguments, 'TEST');
        Core.log.apply(null, arguments);
    }
}


// Authentication

Core.retrieveAuthToken = function (interactive, scopes) {
    if (interactive == undefined) {
        interactive = false;
    }
    return new Promise((resolve, reject) => {
        if (Core.IS_CONTENT_SCRIPT) {
            let data = { method: "getAuthToken", interactive: interactive}
            if (scopes) {
                data.scopes = scopes
            }
            chrome.runtime.sendMessage(data, function (result) {
                if (result.status == 'success') {
                    resolve(result.authToken)
                } else {
                    reject(result.status)
                }
            });
        } else {
            let options = { interactive: interactive }
            if (scopes) {
                options.scopes = scopes
            }
            chrome.identity.getAuthToken(options, function (token) {
                if (token) {
                    Core.logi('Token retrieved: ' + token)
                    resolve(token)
                } else {
                    if (chrome.runtime.lastError) {
                        Core.logd(chrome.runtime.lastError)
                    }
                    Core.logd('No token available')
                    reject('No token available')
                }
            });
        }
    })
}

// Models

/**
 * Create a message response object
 * 
 * @param {String} result Use MessageResponse prototype RESULT_*
 * @param {*} data Data to send back
 */
Core.MessageResponse = function (result, data) {
    this.result = result
    this.data = data;
}

Core.MessageResponse.prototype.RESULT_SUCCESS = 'success'
Core.MessageResponse.prototype.RESULT_FAILURE = 'failure'

/**
 * Check if an object is empty
 */
Core.isEmpty = function (obj) {
    return Object.keys(obj).length === 0 && obj.constructor === Object
}

/**
 * Returns a Promise that creates an alarm with the specified name. 
 * Alarm options are provided as specified here, along with described additions below https://developer.chrome.com/apps/alarms#method-create
 * 
 * override (true) - if true, will clear the old alarm and create the provided.
 * allowMultiple (false) - if true, will create alarm even if one exists. If override is 
 * 
 * @param {String} name Alarm name
 * @param {String} options Options. Additional options include override and allowMultiple
 *
 */
Core.createAlarm = function (name, options) {
    return new Promise((resolve, reject) => {
        if (!options) {
            reject(Error('Must provide chrome.alarms.create required options'))
        }

        let alarmOptions = {}
        if (options.when) {
            alarmOptions.when = options.when
        }

        if (options.delayInMinutes) {
            alarmOptions.delayInMinutes = options.delayInMinutes
        }

        if (options.periodInMinutes) {
            alarmOptions.periodInMinutes = options.periodInMinutes
        }

        if (options.override == undefined) {
            options.override = false
        }

        if (options.allowMultiple == undefined) {
            options.allowMultiple = false
        }

        if (options.override && options.allowMultiple) {
            chrome.alarms.create(name, alarmOptions)
            resolve()
        } else {
            chrome.alarms.get(name, (alarm) => {
                if (!alarm) {
                    // Are not overriding
                    chrome.alarms.create(name, alarmOptions)
                    resolve()
                } else {
                    // Alarm with this name exists
                    if (options.override) {
                        chrome.alarms.clear(name, () => {
                            chrome.alarms.create(name, alarmOptions)
                            resolve()
                        })
                    } else if (options.allowMultiple) {
                        chrome.alarms.create(name, alarmOptions)
                        resolve()
                    } else {
                        resolve()
                    }
                }
            })
        }
    })
}

const _MS_PER_MIN = 1000 * 60;
const _MS_PER_HOUR = _MS_PER_MIN * 60;
const _MS_PER_DAY = _MS_PER_HOUR * 24;

Core.timeColloquial = function (date) {

    const today = new Date(Date.now())

    // Differences

    // Discard the time and time-zone information.
    const dateUTCNoTime = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
    const todayUTCNoTime = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
    const yearDiff = date.getYear() - today.getYear()
    const monthDiff = yearDiff * 12 + date.getMonth() - today.getMonth()
    const dayDiff = Math.floor((todayUTCNoTime - dateUTCNoTime) / _MS_PER_DAY);

    const dateUTC = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds());
    const todayUTC = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), today.getHours(), today.getMinutes(), today.getSeconds());
    const hourDiff = Math.floor((todayUTC - dateUTC) / _MS_PER_HOUR)
    const minDiff = Math.floor((todayUTC - dateUTC) / _MS_PER_MIN)
    const secondsDiff = Math.floor((todayUTC - dateUTC) / 1000)

    /**
    * Returns format H:MM [AM|PM]
    * @param {Date} date 
    */
    const timeLong = function (date) {
        let hoursMilitary
        let amPm

        if (date.getHours() == 0) {
            hours = 12
            amPm = 'AM'
        } else if (date.getHours() > 0 && date.getHours() < 12) {
            hours = date.getHours()
            amPm = 'AM'
        } else if (date.getHours() == 12) {
            hours = date.getHours()
            amPm = 'PM'
        } else {
            hours = date.getHours() - 12
            amPm = 'PM'
        }

        return timePhrase = hours + ':' + Core.formatNumber(date.getMinutes(), 2) + ' ' + amPm
    }

    /**
    * Returns format M/D
    * @param {Date} date 
    */
    const dateShort = function (date) {
        return (date.getMonth() + 1) + '/' + date.getDate()
    }

    /**
     * Returns format M/D/YY
     * @param {Date} date 
     */
    const dateLong = function (date) {
        return (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear().toString().substr(-2)
    }

    // Finally, determine the full phrase
    let datePhrase
    if (dateUTC < todayUTC) {
        if (secondsDiff < 60) {
            // ## seconds ago
            datePhrase = secondsDiff + ' second' + (secondsDiff == 1 ? '' : 's') + ' ago'
        } else if (minDiff < 60) {
            // ## minutes ago
            datePhrase = minDiff + ' minute' + (minDiff == 1 ? '' : 's') + ' ago'
        } else if (hourDiff < 3) {
            // ## hours ago
            datePhrase = hourDiff + ' hour' + (hourDiff == 1 ? '' : 's') + ' ago'
        } else if (dayDiff == 0) {
            // at H:MM [AM|PM]
            datePhrase = 'at ' + timeLong(date)
        } else if (dayDiff == 1) {
            // yesterday at H:MM [AM|PM]
            datePhrase = 'yesterday at ' + timeLong(date)
        } else if (yearDiff == 0 && monthDiff == 0) {
            // on M/DD at H:MM [AM|PM]
            datePhrase = 'on ' + dateShort(date) + ' at ' + timeLong(date)
        } else {
            // on M/DD/YY at H:MM [AM|PM]
            datePhrase = 'on ' + dateLong(date) + ' at ' + timeLong(date)
        }
    } else {
        if (dayDiff == -1) {
            // tomorrow at H:MM [AM|PM]
            datePhrase = 'tomorrow at ' + timeLong(date)
        } else {
            // on M/DD/YY at H:MM [AM|PM]
            datePhrase = 'on ' + dateLong(date) + ' at ' + timeLong(date)
        }
    }
    return datePhrase
}

Core._init()