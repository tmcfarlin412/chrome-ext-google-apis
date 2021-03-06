/*

Copyright 2018 Gerald McFarlin

This file is part of "Google APIs"

"Google APIs" is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

"Google APIs" is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with "Google APIs".  If not, see <https://www.gnu.org/licenses/>.

*/

const Gapi = {}

// Helpers

Gapi.buildQueryParams = function (queryParams) {
    var query = "key=" + Gapi.API_KEY
    if (queryParams) {
        Object.keys(queryParams).forEach(function (key) {
            query = query + "&" + key + "=" + queryParams[key]
        });
    }


    return query
}

Gapi.buildUrl = function (url, queryParams) {
    return url + "?" + Gapi.buildQueryParams(queryParams)
}

// Classroom

/**
 * Milliseconds Per Query Minimum. Milliseconds between each query in order to adhere 
 * to the user quota limitations. Extrapolated the value for Drive requests to come to
 * this value.
 * 
 * See quotas for details
 * https://console.developers.google.com/apis/api/classroom.googleapis.com/quotas?project=cc-for-students-app&duration=PT1H
 */
Gapi.CLASSROOM_MSPQ_MIN = 2000

Gapi.classroomFetchChain = Promise.resolve()

Gapi.handleClassroomApiQuotaErrors = function (response) {
    if (response.status == 403) {
        Core.logd(Error('Quota error'), response)
    }
    return response
}

/**
 * Retrieve Promise that delays the required amount to adhere to the user call quota,
 * taking into account the last time a fetch was called
 */
Gapi.delayClassroomFetch = (function () {

    /**
     * Last time that a request was made to a Drive endpoint
     */
    let lastClassroomFetchTime

    return function () {
        return new Promise((resolve, reject) => {
            let now = Date.now()
            let delay = lastClassroomFetchTime ? (Math.max(now, lastClassroomFetchTime + Gapi.CLASSROOM_MSPQ_MIN) - now) : 0
            Core.logi('Last fetch time: ', lastClassroomFetchTime ? new Date(lastClassroomFetchTime) : 'N/A', 'Delay: ', delay)
            setTimeout(resolve, delay)
            lastClassroomFetchTime = now + delay
        })
    }
})()

Gapi.startClassroomFetch = function () {
    return Gapi.classroomFetchChain = Gapi.classroomFetchChain
        .then(result => Core.retrieveAuthToken())
        .then(token => {
            return Gapi.delayClassroomFetch()
                .then(() => token)
        })
}

/**
 * courses.courseWork.get
 * https://developers.google.com/classroom/reference/rest/v1/courses.courseWork/get
 * @param {*} courseId 
 * @param {*} courseWorkId 
 * @param {*} queryParams 
 */
Gapi.fetchCourseWork = function (courseId, courseWorkId, queryParams) {
    return Gapi.startClassroomFetch().then(token => Gapi.fetchCourseWorkNoDelay(token, courseId, courseWorkId, queryParams))
}

Gapi.fetchCourseWorkNoDelay = function (token, courseId, courseWorkId, queryParams) {
    if (!queryParams) {
        queryParams = {}
    }
    let url = Gapi.buildUrl('https://classroom.googleapis.com/v1/courses/' + courseId + '/courseWork/' + courseWorkId, queryParams)
    return fetch(url, {
        method: 'GET',
        async: true,
        headers: {
            Authorization: 'Bearer ' + token,
            'Content-Type': 'application/json'
        },
        contentType: 'json',
    }).then((response) => {
        Core.logi('fetchCourseWork response', response);
        return Gapi.handleClassroomApiQuotaErrors(response)
    }).then(response => response.json())
}

/**
 * courses.courseWork.list
 * https://developers.google.com/classroom/reference/rest/v1/courses.courseWork/list
 * @param {*} courseId 
 * @param {*} queryParams 
 */
Gapi.fetchCourseWorkList = function (courseId, queryParams) {
    return Gapi.startClassroomFetch().then(token => Gapi.fetchCourseWorkListNoDelay(token, courseId, queryParams))
}

Gapi.fetchCourseWorkListNoDelay = function (token, courseId, queryParams) {
    let url = Gapi.buildUrl('https://classroom.googleapis.com/v1/courses/' + courseId + '/courseWork', queryParams)
    return fetch(url, {
        method: 'GET',
        async: true,
        headers: {
            Authorization: 'Bearer ' + token,
            'Content-Type': 'application/json'
        },
        contentType: 'json',
    }).then((response) => {
        Core.logi('fetchCourseWorkList response', response);
        return Gapi.handleClassroomApiQuotaErrors(response)
    }).then(response => response.json())
}

/**
 * courses.list
 * https://developers.google.com/classroom/reference/rest/v1/courses/list
 * @param {*} courseId 
 * @param {*} queryParams 
 */
Gapi.fetchCourses = function (queryParams) {
    return Gapi.startClassroomFetch().then(token => Gapi.fetchCoursesNoDelay(token, queryParams))
}

Gapi.fetchCoursesNoDelay = function (token, queryParams) {
    let url = Gapi.buildUrl('https://classroom.googleapis.com/v1/courses', queryParams)
    return fetch(url, {
        method: 'GET',
        async: true,
        headers: {
            Authorization: 'Bearer ' + token,
            'Content-Type': 'application/json'
        },
        contentType: 'json',
    }).then((response) => {
        Core.logi('fetchCourses response', response);
        return Gapi.handleClassroomApiQuotaErrors(response)
    }).then(response => response.json())
}

/**
 * courses.get
 * https://developers.google.com/classroom/reference/rest/v1/courses/get
 * @param {*} id 
 * @param {*} queryParams 
 */
Gapi.fetchCourse = function (id, queryParams) {
    return Gapi.startClassroomFetch().then(token => Gapi.fetchCourseNoDelay(token, id, queryParams))
}

Gapi.fetchCourseNoDelay = function (token, id, queryParams) {
    let url = Gapi.buildUrl('https://classroom.googleapis.com/v1/courses/' + id, queryParams)
    return fetch(url, {
        method: 'GET',
        async: true,
        headers: {
            Authorization: 'Bearer ' + token,
            'Content-Type': 'application/json'
        },
        contentType: 'json',
    }).then((response) => {
        Core.logi('fetchCourse response', response);
        return Gapi.handleClassroomApiQuotaErrors(response)
    }).then(response => response.json())
}

/**
 * courses.courseWork.studentSubmissions.list
 * https://developers.google.com/classroom/reference/rest/v1/courses.courseWork.studentSubmissions/list
 * @param {*} courseId 
 * @param {*} queryParams 
 */
Gapi.fetchStudentSubmissions = function (courseId, courseWorkId, queryParams) {
    return Gapi.startClassroomFetch().then(token => Gapi.fetchStudentSubmissionsNoDelay(token, courseId, courseWorkId, queryParams))
}

Gapi.fetchStudentSubmissionsNoDelay = function (token, courseId, courseWorkId, queryParams) {
    if (!queryParams) {
        queryParams = {}
    }
    return fetch(Gapi.buildUrl('https://classroom.googleapis.com/v1/courses/' + courseId + '/courseWork/' + courseWorkId + '/studentSubmissions', queryParams), {
        method: 'GET',
        async: true,
        headers: {
            Authorization: 'Bearer ' + token,
            'Content-Type': 'application/json'
        },
        contentType: 'json',
    }).then((response) => {
        Core.logi('fetchStudentSubmissions response', response);
        return Gapi.handleClassroomApiQuotaErrors(response)
    }).then(response => response.json())
}

/**
 * courses.students.get
 * https://developers.google.com/classroom/reference/rest/v1/courses.students/get
 * @param {*} courseId 
 * @param {*} queryParams 
 */
Gapi.fetchStudent = function (courseId, userId, queryParams) {
    return Gapi.startClassroomFetch().then(token => Gapi.fetchStudentNoDelay(token, courseId, userId, queryParams))
}

Gapi.fetchStudentNoDelay = function (token, courseId, userId, queryParams) {
    return fetch(Gapi.buildUrl('https://classroom.googleapis.com/v1/courses/' + courseId + '/students/' + userId, queryParams), {
        method: 'GET',
        async: true,
        headers: {
            Authorization: 'Bearer ' + token,
            'Content-Type': 'application/json'
        },
        contentType: 'json',
    }).then((response) => {
        Core.logi('fetchStudent response', response);
        return Gapi.handleClassroomApiQuotaErrors(response)
    }).then(response => response.json())
}

/**
 * courses.students.list
 * https://developers.google.com/classroom/reference/rest/v1/courses.students/list
 * @param {*} courseId 
 * @param {*} queryParams 
 */
Gapi.fetchStudentList = function (courseId, queryParams) {
    return Gapi.startClassroomFetch().then(token => Gapi.fetchStudentListNoDelay(token, courseId, queryParams))
}

Gapi.fetchStudentListNoDelay = function (token, courseId, queryParams) {
    return fetch(Gapi.buildUrl('https://classroom.googleapis.com/v1/courses/' + courseId + '/students', queryParams), {
        method: 'GET',
        async: true,
        headers: {
            Authorization: 'Bearer ' + token,
            'Content-Type': 'application/json'
        },
        contentType: 'json',
    }).then((response) => {
        Core.logi('fetchStudent response', response);
        return Gapi.handleClassroomApiQuotaErrors(response)
    }).then(response => response.json())
}

// Drive

/**
 * Milliseconds Per Query Minimum. Milliseconds between each query in order to adhere 
 * to the user quota limitations. Loosely determined experimentally. 
 * 
 * Updating properties on files were causing 403 quota issue responses.
 * Google claims to support 1000 queries/user/100s. However, firing off 
 * a query at 10 QPS rate was still causing issues. Making requests every 400ms 
 * increased success rate to ~80%. A 500ms guaranteed delay resulted in 100% success on 1000
 * calls. Chaining requests (waiting for one to complete before starting the next) 
 * resulted in 100% success as well. Thus, the decision was made in pursuit of accuracy and
 * not wasting resources to only send 1 response at a time, and ensure that 500ms
 * pass between subsequent requests. Super conservative, not super performant, but
 * a good way to prevent 403s (for the user quota)
 * 
 * See quotas for details
 * https://console.developers.google.com/apis/api/drive.googleapis.com/overview?project=cc-for-students-app
 */
Gapi.DRIVE_MSPQ_MIN = 1000

Gapi.driveFetchChain = Promise.resolve()

Gapi.handleDriveApiQuotaErrors = function (response) {
    if (response.status == 403) {
        Core.logd(Error('Quota error'), response)
    }
    return response
}

/**
 * Retrieve Promise that delays the required amount to adhere to the user call quota,
 * taking into account the last time a fetch was called
 */
Gapi.delayDriveFetch = (function () {

    /**
     * Last time that a request was made to a Drive endpoint
     */
    let lastDriveFetchTime

    return function () {
        return new Promise((resolve, reject) => {
            let now = Date.now()
            let delay = lastDriveFetchTime ? (Math.max(now, lastDriveFetchTime + Gapi.DRIVE_MSPQ_MIN) - now) : 0
            Core.logi('Last fetch time: ', lastDriveFetchTime ? new Date(lastDriveFetchTime) : 'N/A', 'Delay: ', delay)
            setTimeout(resolve, delay)
            lastDriveFetchTime = now + delay
        })
    }
})()

Gapi.startDriveFetch = function () {
    return Gapi.driveFetchChain = Gapi.driveFetchChain
        .then(result => Core.retrieveAuthToken())
        .then(token => {
            return Gapi.delayDriveFetch()
                .then(() => token)
        })
}

/**
 * Files: get
 * https://developers.google.com/drive/api/v3/reference/files/get
 * @param {*} fileId 
 * @param {*} queryParams 
 */
Gapi.fetchFile = function (fileId, queryParams) {
    return Gapi.startDriveFetch().then(token => Gapi.fetchFileNoDelay(token, fileId, queryParams))
}

Gapi.fetchFileNoDelay = function (token, fileId, queryParams) {
    return fetch(Gapi.buildUrl('https://www.googleapis.com/drive/v3/files/' + fileId, queryParams), {
        method: 'GET',
        async: true,
        headers: {
            Authorization: 'Bearer ' + token,
            'Content-Type': 'application/json'
        },
        contentType: 'json'
    }).then((response) => {
        Core.logi('fetchFile response', response);
        return Gapi.handleDriveApiQuotaErrors(response)
    }).then(response => response.json())
}

/**
 * Files: list
 * https://developers.google.com/drive/api/v3/reference/files/list
 * @param {*} queryParams 
 */
Gapi.fetchFiles = function (queryParams) {
    return Gapi.startDriveFetch().then((token) => Gapi.fetchFilesNoDelay(token, queryParams))
}

Gapi.fetchFilesNoDelay = function (token, queryParams) {
    return fetch(Gapi.buildUrl('https://www.googleapis.com/drive/v3/files', queryParams), {
        method: 'GET',
        async: true,
        headers: {
            Authorization: 'Bearer ' + token,
            'Content-Type': 'application/json'
        },
        contentType: 'json'
    }).then((response) => {
        Core.logi('fetchFiles response', response);
        return Gapi.handleDriveApiQuotaErrors(response)
    }).then(response => response.json())
}

/**
 * Files: update (properties)
 * https://developers.google.com/drive/api/v3/reference/files/update
 * @param {*} fileId 
 * @param {*} queryParams 
 * @param {*} metadata metadata to update. to update properties, provide object as such:
 * 
 *  let body = {
 *      properties: {
 *          key: value
 *      }
 *  }
 */
Gapi.updateFileMetadata = function (fileId, queryParams, metadata) {
    return Gapi.startDriveFetch().then(token => Gapi.updateFileMetadataNoDelay(token, fileId, queryParams, metadata))
}

Gapi.updateFileMetadataNoDelay = function (token, fileId, queryParams, metadata) {
    return fetch(Gapi.buildUrl('https://www.googleapis.com/drive/v3/files/' + fileId, queryParams), {
        method: 'PATCH',
        async: true,
        headers: {
            Authorization: 'Bearer ' + token,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(metadata)
    }).then((response) => {
        Core.logi('updateFileProperty response', response);
        return Gapi.handleDriveApiQuotaErrors(response)
    }).then(response => response.json())
}

Gapi.fetchMultipartUpload = function (formData, queryParams) {
    return Gapi.startDriveFetch().then(token => Gapi.fetchMultipartUploadNoDelay(token, formData, queryParams))
}

Gapi.fetchMultipartUploadNoDelay = function (token, formData, queryParams) {
    if (!queryParams) {
        queryParams = {
        }
    }
    queryParams.uploadType = 'multipart'

    return fetch(Gapi.buildUrl("https://www.googleapis.com/upload/drive/v3/files", queryParams), {
        method: "POST",
        async: true,
        headers: {
            "Authorization": "Bearer " + token,
        },
        body: formData,
    }).then((response) => {
        Core.logi('fetchMultipartUpload response', response);
        return Gapi.handleDriveApiQuotaErrors(response)
    }).then(response => response.json())
}

Gapi.fetchMultipartUpdate = function (fileId, formData, queryParams) {
    return Gapi.startDriveFetch().then(token => Gapi.fetchMultipartUpdateNoDelay(token, fileId, formData, queryParams))
}

Gapi.fetchMultipartUpdateNoDelay = function (token, fileId, formData, queryParams) {
    if (!queryParams) {
        queryParams = {
        }
    }
    queryParams.uploadType = 'multipart'

    return fetch(Gapi.buildUrl("https://www.googleapis.com/upload/drive/v3/files/" + fileId, queryParams), {
        method: "PATCH",
        async: true,
        headers: {
            "Authorization": "Bearer " + token,
        },
        body: formData,
    }).then((response) => {
        Core.logi('fetchMultipartUpdate response', response);
        return Gapi.handleDriveApiQuotaErrors(response)
    }).then(response => response.json())
}

Gapi.fetchGeneratedIds = function (queryParams) {
    return Gapi.startDriveFetch().then(token => Gapi.fetchGeneratedIdsNoDelay(token, queryParams))
}

Gapi.fetchGeneratedIdsNoDelay = function (token, queryParams) {
    return fetch(Gapi.buildUrl("https://www.googleapis.com/drive/v3/files/generateIds", queryParams), {
        method: 'GET',
        async: true,
        headers: {
            "Authorization": "Bearer " + token,
            'Content-Type': 'application/json'
        },
    }).then((response) => {
        Core.logi('fetchGeneratedIds response', response);
        return Gapi.handleDriveApiQuotaErrors(response)
    }).then(response => response.json())
}

Gapi.fetchCreatePermission = function (id, permissionResource, queryParams) {
    return Gapi.startDriveFetch().then(token => Gapi.fetchCreatePermissionNoDelay(token, id, permissionResource, queryParams))
}

Gapi.fetchCreatePermissionNoDelay = function (token, id, permissionResource, queryParams) {
    if (!queryParams) {
        queryParams = {
        }
    }

    return fetch(Gapi.buildUrl("https://www.googleapis.com/drive/v3/files/" + id + "/permissions", queryParams), {
        method: "POST",
        async: true,
        headers: {
            "Authorization": "Bearer " + token,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(permissionResource),
    }).then((response) => {
        Core.logi('fetchCreatePermission response', response);
        return Gapi.handleDriveApiQuotaErrors(response)
    }).then(response => response.json())
}


// Calendar

/**
 * Milliseconds Per Query Minimum. Milliseconds between each query in order to adhere 
 * to the user quota limitations. Extrapolated the value for Drive requests to come to
 * this value.
 * 
 * See quotas for details
 * https://console.developers.google.com/apis/api/calendar.googleapis.com/quotas?project=cc-for-students-app&duration=PT1H
 */
Gapi.CALENDAR_MSPQ_MIN = 2000

Gapi.calendarFetchChain = Promise.resolve()

Gapi.handleCalendarApiQuotaErrors = function (response) {
    if (response.status == 403) {
        Core.logd(Error('Quota error'), response)
    }
    return response
}

/**
 * Retrieve Promise that delays the required amount to adhere to the user call quota,
 * taking into account the last time a fetch was called
 */
Gapi.delayCalendarFetch = (function () {

    /**
     * Last time that a request was made to a Drive endpoint
     */
    let lastCalendarFetchTime

    return function () {
        return new Promise((resolve, reject) => {
            let now = Date.now()
            let delay = lastCalendarFetchTime ? (Math.max(now, lastCalendarFetchTime + Gapi.CALENDAR_MSPQ_MIN) - now) : 0
            Core.logi('Last fetch time: ', lastCalendarFetchTime ? new Date(lastCalendarFetchTime) : 'N/A', 'Delay: ', delay)
            setTimeout(resolve, delay)
            lastCalendarFetchTime = now + delay
        })
    }
})()

Gapi.startCalendarFetch = function () {
    return Gapi.calendarFetchChain = Gapi.calendarFetchChain
        .then(result => Core.retrieveAuthToken())
        .then(token => {
            return Gapi.delayCalendarFetch()
                .then(() => token)
        })
}

Gapi.fetchCalendarCalendarListList = function (queryParams) {
    return Gapi.startCalendarFetch().then(token => Gapi.fetchCalendarCalendarListListNoDelay(token, queryParams))
}

Gapi.fetchCalendarCalendarListListNoDelay = function (token, queryParams) {
    if (!queryParams) {
        queryParams = {
        }
    }
    return fetch(Gapi.buildUrl("https://www.googleapis.com/calendar/v3/users/me/calendarList", queryParams), {
        method: "GET",
        async: true,
        headers: {
            "Authorization": "Bearer " + token,
            'Content-Type': 'application/json'
        },
    }).then((response) => {
        Core.logi('fetchCalendarCalendarListList response', response);
        return Gapi.handleCalendarApiQuotaErrors(response)
    }).then(response => response.json())        
}

Gapi.fetchCalendarEventsList = function (calendarId, queryParams) {
    return Gapi.startCalendarFetch().then(token => Gapi.fetchCalendarEventsListNoDelay(token, calendarId, queryParams))
}

Gapi.fetchCalendarEventsListNoDelay = function (token, calendarId, queryParams) {
    if (!queryParams) {
        queryParams = {
        }
    }
    return fetch(Gapi.buildUrl("https://www.googleapis.com/calendar/v3/calendars/" + calendarId + "/events", queryParams), {
        method: "GET",
        async: true,
        headers: {
            "Authorization": "Bearer " + token,
            'Content-Type': 'application/json'
        },
    }).then((response) => {
        Core.logi('fetchCalendarEventsList response', response);
        return Gapi.handleCalendarApiQuotaErrors(response)
    }).then(response => response.json())        
}

Gapi.fetchCalendarFreebusy = function (timeMin, timeMax, timeZone, items) {
    return Gapi.startCalendarFetch().then(token => Gapi.fetchCalendarFreebusyNoDelay(token, timeMin, timeMax, timeZone, items))
}

Gapi.fetchCalendarFreebusyNoDelay = function (token, timeMin, timeMax, timeZone, items) {
    return fetch(Gapi.buildUrl("https://www.googleapis.com/calendar/v3/freeBusy"), {
        method: "POST",
        async: true,
        headers: {
            "Authorization": "Bearer " + token,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "timeMin": timeMin,
            "timeMax": timeMax,
            "timeZone": timeZone,
            "items": items
        })
    }).then((response) => {
        Core.logi('fetchCalendarFreebusy response', response);
        return Gapi.handleCalendarApiQuotaErrors(response)
    }).then(response => response.json())        
}

// Sheet

/**
 * Milliseconds Per Query Minimum. Milliseconds between each query in order to adhere 
 * to the user quota limitations. Extrapolated the value for Drive requests to come to
 * this value.
 * 
 * See quotas for details
 * https://console.developers.google.com/apis/api/sheet.googleapis.com/quotas?project=cc-for-students-app&duration=PT1H
 */
Gapi.SHEET_MSPQ_MIN = 2000

Gapi.sheetFetchChain = Promise.resolve()

Gapi.handleSheetApiQuotaErrors = function (response) {
    if (response.status == 403) {
        Core.logd(Error('Quota error'), response)
    }
    return response
}

/**
 * Retrieve Promise that delays the required amount to adhere to the user call quota,
 * taking into account the last time a fetch was called
 */
Gapi.delaySheetFetch = (function () {

    /**
     * Last time that a request was made to a Drive endpoint
     */
    let lastSheetFetchTime

    return function () {
        return new Promise((resolve, reject) => {
            let now = Date.now()
            let delay = lastSheetFetchTime ? (Math.max(now, lastSheetFetchTime + Gapi.SHEET_MSPQ_MIN) - now) : 0
            Core.logi('Last fetch time: ', lastSheetFetchTime ? new Date(lastSheetFetchTime) : 'N/A', 'Delay: ', delay)
            setTimeout(resolve, delay)
            lastSheetFetchTime = now + delay
        })
    }
})()

Gapi.startSheetFetch = function () {
    return Gapi.sheetFetchChain = Gapi.sheetFetchChain
        .then(result => Core.retrieveAuthToken())
        .then(token => {
            return Gapi.delaySheetFetch()
                .then(() => token)
        })
}

Gapi.fetchSheetSpreadsheetsValuesClear = function (spreadsheetId, range) {
    return Gapi.startSheetFetch().then(token => Gapi.fetchSheetSpreadsheetsValuesClearNoDelay(token, spreadsheetId, range))
}

Gapi.fetchSheetSpreadsheetsValuesClearNoDelay = function (token, spreadsheetId, range) {
    return fetch(Gapi.buildUrl("https://sheets.googleapis.com/v4/spreadsheets/" + spreadsheetId + "/values/" + range + ":clear"), {
        method: "POST",
        async: true,
        headers: {
            "Authorization": "Bearer " + token,
            'Content-Type': 'application/json'
        }
    }).then((response) => {
        Core.logi('fetchSheetSpreadsheetsValuesClear response', response);
        return Gapi.handleSheetApiQuotaErrors(response)
    }).then(response => response.json())
}

Gapi.fetchSheetSpreadsheetsValuesUpdate = function (spreadsheetId, range, valueRange, queryParams) {
    return Gapi.startSheetFetch().then(token => Gapi.fetchSheetSpreadsheetsValuesUpdateNoDelay(token, spreadsheetId, range, valueRange, queryParams))
}

Gapi.fetchSheetSpreadsheetsValuesUpdateNoDelay = function (token, spreadsheetId, range, valueRange, queryParams) {
    return fetch(Gapi.buildUrl("https://sheets.googleapis.com/v4/spreadsheets/" + spreadsheetId + "/values/" + range, queryParams), {
        method: "PUT",
        async: true,
        headers: {
            "Authorization": "Bearer " + token,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(valueRange)
    }).then((response) => {
        Core.logi('fetchSheetSpreadsheetsValuesClear response', response);
        return Gapi.handleSheetApiQuotaErrors(response)
    }).then(response => response.json())
}
