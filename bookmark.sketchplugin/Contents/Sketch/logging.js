function debug(msg, body) {
    if (is_debug) {
        log("***" + msg);
        log(body);
    }
}
