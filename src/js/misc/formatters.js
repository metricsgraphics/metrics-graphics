function format_rollover_number(args) {
    var num;
    if (args.format === 'count') {
        num = function(d_) {
            var is_float = d_ % 1 !== 0;
            var n = d3.format("0,000");
            d_ = is_float ? d3.round(d_, args.decimals) : d_;
            return n(d_);
        };
    } else {
        num = function(d_) {
            var fmt_string = (args.decimals ? '.' + args.decimals : '' ) + '%';
            var n = d3.format(fmt_string);
            return n(d_);
        };
    }
    return num;
}

MG.format_rollover_number = format_rollover_number;
