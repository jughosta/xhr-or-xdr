(function () {
    'use strict';

    var XDR = !window.msPerformance && window.XDomainRequest || null,
        XHR = window.XMLHttpRequest || function() {
            try { return new ActiveXObject("Msxml2.XMLHTTP.6.0"); } catch (e1) {}
            try { return new ActiveXObject("Msxml2.XMLHTTP.3.0"); } catch (e2) {}
            try { return new ActiveXObject("Msxml2.XMLHTTP"); } catch (e3) {}
            throw new Error("This browser does not support XMLHttpRequest.");
        };

    if (window.XMLHttpRequest && ('withCredentials' in (new XMLHttpRequest()))) {
        return;
    }

    if (!XDR) {
        return;
    }

    /**
     * XMLHttpRequest adapter for cross-origin and same-origin requests in IE8-9
     * @constructor
     */
    function XMLHttpRequestAdapter () {
        this.xdr = null;
        this.withCredentials = false;
        this.status = '';
        this.readyState = 0;
        this.responseType = null;
        this.responseText = '';
        this.isXHR = false;
    }

    /**
     * Open
     * @param {string} method
     * @param {string} url
     * @param {boolean} async
     */
    XMLHttpRequestAdapter.prototype.open = function (method, url, async) {
        if (!url || !(typeof url === 'string')) {
            return;
        }

        if (url.search(document.location.host) > -1) { // same-origin
            this.xdr = new XHR();
            this.xdr.open(method, url, async);
            this.isXHR = true;
            return;
        }

        this.xdr = new XDR(); // cross-origin

        this.xdr.open(method.toLowerCase(), url);

        var self = this;

        this.xdr.ontimeout = function () {
            self.readyState = 2;
            self.responseText = 'Timeout';
            self.status = 408;
            self.xdr.abort();
            self.onreadystatechange();
        };

        this.xdr.onerror = function () {
            self.readyState = 2;
            self.responseText = 'Error';
            self.status = 500;
            self.xdr.abort();
            self.onreadystatechange();
        };

        this.xdr.onprogress = function () {
            self.readyState = 1;
        };

        this.xdr.onload = function () {
            self.readyState = 4;
            self.status = 200;
            self.responseText = self.xdr.responseText;
            self.onreadystatechange();
        };
    };

    /**
     * Send
     * @param {*} data
     */
    XMLHttpRequestAdapter.prototype.send = function (data) {
        var self = this;
        if (this.isXHR) {
            self.xdr.onreadystatechange = function () {
                if (self.xdr.readyState !== 4) {
                    return;
                }
                self.readyState = self.xdr.readyState;
                self.status = self.xdr.status;
                self.responseText = self.xdr.responseText;
                self.onreadystatechange();
            };
            self.xdr.send(data);
        }
        else {
            setTimeout(function () {
                self.xdr.send(data);
            }, 0);
        }
    };

    /**
     * Abort
     */
    XMLHttpRequestAdapter.prototype.abort = function () {
        this.xdr.abort();
    };

    /**
     * Set request header
     * @param {string} header
     * @param {string} value
     */
    XMLHttpRequestAdapter.prototype.setRequestHeader = function (header, value) {
        if (this.isXHR) {
            this.xdr.setRequestHeader(header, value);
        }
    };

    /**
     * Get all response headers
     * @returns {*}
     */
    XMLHttpRequestAdapter.prototype.getAllResponseHeaders = function () {
        if (this.isXHR) {
            return this.xdr.getAllResponseHeaders();
        }
        var headers = {
            'Content-Type': this.xdr.contentType
        };
        return headers;
    };

    /**
     * Event: onReadyStateChange
     */
    XMLHttpRequestAdapter.prototype.onreadystatechange = function () {

    };

    window.XMLHttpRequest = XMLHttpRequestAdapter;

})();