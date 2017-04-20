function debug(msg, body) {
    if (is_debug) {
        log("***" + msg);
        log(body);
    }
}

function start_debug(msg) {
    if (is_debug) {
        log(">>>>>> " + msg + " ***");
    }
}

function end_debug(msg) {
    if (is_debug) {
        log("<<<<<< " + msg + " $$$");
    }
}
