Core.IS_CONTENT_SCRIPT = false

window.onload = function () {

    responseDiv = this.document.getElementById('response')

    // Common APIs
    document.getElementById('auth').addEventListener('click', () => {
        Core.retrieveAuthToken(true)
        .then(token => {
            Core.logi(token)
            responseDiv.innerHTML = token
        })
    })

    // Drive APIs
    document.getElementById('filesList').addEventListener('click', () => {
        let queryParamsValue = document.getElementById('filesListQueryParams').value
        let queryParams = queryParamsValue.length == 0 ? {} : JSON.parse(queryParamsValue)
        Gapi.fetchFiles(queryParams)
            .then(json => {
                Core.logi(json)
                responseDiv.innerHTML = JSON.stringify(json, undefined, 2)
            }).catch(error => {
                Core.logd(error)
                responseDiv.innerHTML = error
            });
    })

    document.getElementById('filesGet').addEventListener('click', () => {
        let fileID = document.getElementById('filesGetID').value
        let queryParamsValue = document.getElementById('filesGetQueryParams').value
        let queryParams = queryParamsValue.length == 0 ? {} : JSON.parse(queryParamsValue)
        Gapi.fetchFile(fileID, queryParams)
            .then(json => {
                Core.logi(json)
                responseDiv.innerHTML = JSON.stringify(json, undefined, 2)
            }).catch(error => {
                Core.logd(error);
                responseDiv.innerHTML = error
            });
    })

    document.getElementById('cFilesInFolder').addEventListener('click', () => {
        let folderID = document.getElementById('cFilesInFolderID').value
        Gapi.fetchFiles({ fields: "*", q: "'" + folderID + "' in parents" })
            .then(json => {
                Core.logi(json)
                responseDiv.innerHTML = JSON.stringify(json, undefined, 2)
            }).catch(error => {
                Core.logd(error);
                responseDiv.innerHTML = error
            });
    })

    document.getElementById('filesUpdate').addEventListener('click', () => {
        let fileID = document.getElementById('filesUpdateID').value
        let metadataValue = document.getElementById('fileUpdateMetadata').value
        let metadata = metadataValue.length == 0 ? {} : JSON.parse(metadataValue)
        Gapi.updateFileMetadata(fileID, { fields: "*" }, metadata)
            .then(json => {
                Core.logi(json)
                responseDiv.innerHTML = JSON.stringify(json, undefined, 2)
            }).catch(error => {
                Core.logd(error);
                responseDiv.innerHTML = error
            });
    })

    document.getElementById('filesMultipartUpload').addEventListener('click', () => {
        let name = document.getElementById('filesMultipartUploadName').value
        let content = document.getElementById('filesMultipartUploadContent').value

        let metadata = {
            name: name,
            mimeType: 'text/plain',
            // parents: [
            //     result.folderId
            // ]
        }

        var formData = new FormData()
        let metadataBlob = new Blob([JSON.stringify(metadata)], { type: 'application/json; charset=UTF-8' })
        formData.append('metadata', metadataBlob)

        let textBlob = new Blob([content], { type: 'text/plain' })
        formData.append('file', textBlob)

        Gapi.fetchMultipartUpload(formData, {fields: '*'})
            .then(json => {
                responseDiv.innerHTML = JSON.stringify(json, undefined, 2)
                Core.logi(json)
            }).catch(error => {
                Core.logd(error);
                responseDiv.innerHTML = error
            });
    })
    
    document.getElementById('permissionsCreateView').addEventListener('click', () => {
        let fileID = document.getElementById('permissionsCreateViewID').value
        let email = document.getElementById('permissionsCreateViewEmail').value

        let permissionResource = {
            kind: "drive#permission",
            role: "reader",
            type: "user",
            emailAddress: email,
            sendNotificationEmail: false,
        }

        Gapi.fetchCreatePermission(fileID, permissionResource, { fields: '*'})
            .then(json => {
                Core.logi(json)
                responseDiv.innerHTML = JSON.stringify(json, undefined, 2)
            }).catch(error => {
                Core.logd(error);
                responseDiv.innerHTML = error
            });
    })

    // Classroom
    document.getElementById('coursesList').addEventListener('click', () => {
        let queryParamsValue = document.getElementById('coursesListQueryParams').value
        let queryParams = queryParamsValue.length == 0 ? {} : JSON.parse(queryParamsValue)
        Gapi.fetchCourses(queryParams)
            .then(json => {
                Core.logi(json)
                responseDiv.innerHTML = JSON.stringify(json, undefined, 2)
            }).catch(error => {
                Core.logd(error);
                responseDiv.innerHTML = error
            });
    })


    document.getElementById('coursesGet').addEventListener('click', function () {
        let courseId = document.getElementById('coursesGetCourseID').value
        Gapi.fetchCourse(courseId, { fields: '*' })
            .then(json => {
                Core.logi(json)
                responseDiv.innerHTML = JSON.stringify(json, undefined, 2)
            }).catch(error => {
                Core.logd(error);
                responseDiv.innerHTML = error
            });
    })


    document.getElementById('coursesCourseWorkList').addEventListener('click', function () {
        let courseId = document.getElementById('coursesCourseWorkListCourseID').value
        Gapi.fetchCourseWorkList(courseId, { fields: '*' })
            .then(json => {
                Core.logi(json)
                responseDiv.innerHTML = JSON.stringify(json, undefined, 2)
            }).catch(error => {
                Core.logd(error);
                responseDiv.innerHTML = error
            });
    })

    document.getElementById('coursesCourseWorkGet').addEventListener('click', function () {
        let courseId = document.getElementById('coursesCourseWorkGetCourseID').value
        let courseWorkId = document.getElementById('coursesCourseWorkGetCourseWorkID').value
        Gapi.fetchCourseWork(courseId, courseWorkId, { fields: '*' })
            .then(json => {
                Core.logi(json)
                responseDiv.innerHTML = JSON.stringify(json, undefined, 2)
            }).catch(error => {
                Core.logd(error);
                responseDiv.innerHTML = error
            });
    })

    document.getElementById('coursesCourseWorkWtudentSubmissionsList').addEventListener('click', function () {
        let courseID = document.getElementById('coursesCourseWorkWtudentSubmissionsListCourseID').value
        let courseWorkId = document.getElementById('coursesCourseWorkWtudentSubmissionsListCourseWorkID').value
        Gapi.fetchStudentSubmissions(courseID, courseWorkId, { fields: '*' })
            .then(json => {
                Core.logi(json)
                responseDiv.innerHTML = JSON.stringify(json, undefined, 2)
            }).catch(error => {
                Core.logd(error);
                responseDiv.innerHTML = error
            });
    })
}