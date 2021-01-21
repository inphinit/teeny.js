const mimes = {
    '3g2': 'video/3gpp2',
    '3gp': 'video/3gpp',
    '7z': 'application/x-7z-compressed',
    aac: 'audio/aac',
    abw: 'application/x-abiword',
    ai: 'application/postscript',
    aif: 'audio/x-aiff',
    aifc: 'audio/x-aiff',
    aiff: 'audio/x-aiff',
    arc: 'application/x-freearc',
    asc: 'text/plain',
    atom: 'application/atom+xml',
    au: 'audio/basic',
    avi: 'video/x-msvideo',
    azw: 'application/vnd.amazon.ebook',
    bcpio: 'application/x-bcpio',
    bmp: 'image/bmp',
    bz2: 'application/x-bzip2',
    bz: 'application/x-bzip',
    cdf: 'application/x-netcdf',
    cgm: 'image/cgm',
    cpio: 'application/x-cpio',
    cpt: 'application/mac-compactpro',
    csh: 'application/x-csh',
    css: 'text/css',
    csv: 'text/csv',
    dcr: 'application/x-director',
    dir: 'application/x-director',
    djv: 'image/vnd.djvu',
    djvu: 'image/vnd.djvu',
    doc: 'application/msword',
    docm: 'application/vnd.ms-word.document.macroEnabled.12',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    dot: 'application/msword',
    dotm: 'application/vnd.ms-word.template.macroEnabled.12',
    dotx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.template',
    dtd: 'application/xml-dtd',
    dvi: 'application/x-dvi',
    dxr: 'application/x-director',
    eot: 'application/vnd.ms-fontobject',
    eps: 'application/postscript',
    epub: 'application/epub+zip',
    etx: 'text/x-setext',
    ez: 'application/andrew-inset',
    gif: 'image/gif',
    gram: 'application/srgs',
    grxml: 'application/srgs+xml',
    gtar: 'application/x-gtar',
    gz: 'application/gzip',
    hdf: 'application/x-hdf',
    hqx: 'application/mac-binhex40',
    htm: 'text/html',
    html: 'text/html',
    ice: 'x-conference/x-cooltalk',
    ico: 'image/x-icon',
    ics: 'text/calendar',
    ief: 'image/ief',
    ifb: 'text/calendar',
    iges: 'model/iges',
    igs: 'model/iges',
    jpe: 'image/jpeg',
    jpeg: 'image/jpeg',
    jpg: 'image/jpeg',
    js: 'application/javascript',
    json: 'application/json',
    jsonld: 'application/ld+json',
    kar: 'audio/midi',
    latex: 'application/x-latex',
    m3u: 'audio/x-mpegurl',
    m4v: 'video/mp4',
    man: 'application/x-troff-man',
    mathml: 'application/mathml+xml',
    me: 'application/x-troff-me',
    mesh: 'model/mesh',
    mid: 'audio/midi audio/x-midi',
    mid: 'audio/midi',
    midi: 'audio/midi audio/x-midi',
    midi: 'audio/midi',
    mif: 'application/vnd.mif',
    mjs: 'text/javascript',
    mov: 'video/quicktime',
    movie: 'video/x-sgi-movie',
    mp2: 'audio/mpeg',
    mp3: 'audio/mpeg',
    mp4: 'video/mp4',
    mpe: 'video/mpeg',
    mpeg: 'video/mpeg',
    mpg: 'video/mpeg',
    mpga: 'audio/mpeg',
    mpkg: 'application/vnd.apple.installer+xml',
    ms: 'application/x-troff-ms',
    msh: 'model/mesh',
    mxu: 'video/vnd.mpegurl',
    nc: 'application/x-netcdf',
    oda: 'application/oda',
    odp: 'application/vnd.oasis.opendocument.presentation',
    ods: 'application/vnd.oasis.opendocument.spreadsheet',
    odt: 'application/vnd.oasis.opendocument.text',
    oga: 'audio/ogg',
    ogg: 'application/ogg',
    ogv: 'video/ogg',
    ogx: 'application/ogg',
    opus: 'audio/opus',
    otf: 'font/otf',
    pbm: 'image/x-portable-bitmap',
    pdb: 'chemical/x-pdb',
    pdf: 'application/pdf',
    pgm: 'image/x-portable-graymap',
    pgn: 'application/x-chess-pgn',
    php: 'application/x-httpd-php',
    png: 'image/png',
    pnm: 'image/x-portable-anymap',
    pot: 'application/vnd.ms-powerpoint',
    potm: 'application/vnd.ms-powerpoint.template.macroEnabled.12',
    potx: 'application/vnd.openxmlformats-officedocument.presentationml.template',
    ppa: 'application/vnd.ms-powerpoint',
    ppam: 'application/vnd.ms-powerpoint.addin.macroEnabled.12',
    ppm: 'image/x-portable-pixmap',
    pps: 'application/vnd.ms-powerpoint',
    ppsm: 'application/vnd.ms-powerpoint.slideshow.macroEnabled.12',
    ppsx: 'application/vnd.openxmlformats-officedocument.presentationml.slideshow',
    ppt: 'application/vnd.ms-powerpoint',
    pptm: 'application/vnd.ms-powerpoint.presentation.macroEnabled.12',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ps: 'application/postscript',
    qt: 'video/quicktime',
    ra: 'audio/x-pn-realaudio',
    ram: 'audio/x-pn-realaudio',
    rar: 'application/vnd.rar',
    ras: 'image/x-cmu-raster',
    rdf: 'application/rdf+xml',
    rgb: 'image/x-rgb',
    rm: 'application/vnd.rn-realmedia',
    roff: 'application/x-troff',
    rss: 'application/rss+xml',
    rtf: 'application/rtf',
    rtf: 'text/rtf',
    rtx: 'text/richtext',
    sgm: 'text/sgml',
    sgml: 'text/sgml',
    sh: 'application/x-sh',
    shar: 'application/x-shar',
    silo: 'model/mesh',
    sit: 'application/x-stuffit',
    skd: 'application/x-koan',
    skm: 'application/x-koan',
    skp: 'application/x-koan',
    skt: 'application/x-koan',
    smi: 'application/smil',
    smil: 'application/smil',
    snd: 'audio/basic',
    spl: 'application/x-futuresplash',
    src: 'application/x-wais-source',
    sv4cpio : 'application/x-sv4cpio',
    sv4crc  : 'application/x-sv4crc',
    svg: 'image/svg+xml',
    svgz: 'image/svg+xml',
    swf: 'application/x-shockwave-flash',
    t: 'application/x-troff',
    tar: 'application/x-tar',
    tcl: 'application/x-tcl',
    tex: 'application/x-tex',
    texi: 'application/x-texinfo',
    texinfo : 'application/x-texinfo',
    tif: 'image/tiff',
    tiff: 'image/tiff',
    tr: 'application/x-troff',
    ts: 'video/mp2t',
    tsv: 'text/tab-separated-values',
    ttf: 'font/ttf',
    txt: 'text/plain',
    ustar: 'application/x-ustar',
    vcd: 'application/x-cdlink',
    vrml: 'model/vrml',
    vsd: 'application/vnd.visio',
    vxml: 'application/voicexml+xml',
    wav: 'audio/wav',
    wav: 'audio/x-wav',
    wbmp: 'image/vnd.wap.wbmp',
    wbxml: 'application/vnd.wap.wbxml',
    weba: 'audio/webm',
    webm: 'video/webm',
    webp: 'image/webp',
    wml: 'text/vnd.wap.wml',
    wmlc: 'application/vnd.wap.wmlc',
    wmls: 'text/vnd.wap.wmlscript',
    wmlsc: 'application/vnd.wap.wmlscriptc',
    woff2: 'font/woff2',
    woff: 'font/woff',
    wrl: 'model/vrml',
    xbm: 'image/x-xbitmap',
    xht: 'application/xhtml+xml',
    xhtml: 'application/xhtml+xml',
    xla: 'application/vnd.ms-excel',
    xlam: 'application/vnd.ms-excel.addin.macroEnabled.12',
    xls: 'application/vnd.ms-excel',
    xlsb: 'application/vnd.ms-excel.sheet.binary.macroEnabled.12',
    xlsm: 'application/vnd.ms-excel.sheet.macroEnabled.12',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    xlt: 'application/vnd.ms-excel',
    xltm: 'application/vnd.ms-excel.template.macroEnabled.12',
    xltx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.template',
    xml: 'application/xml',
    xpm: 'image/x-xpixmap',
    xsl: 'application/xml',
    xslt: 'application/xslt+xml',
    xul: 'application/vnd.mozilla.xul+xml',
    xwd: 'image/x-xwindowdump',
    xyz: 'chemical/x-xyz',
    zip: 'application/zip'
};

module.exports = (filepath) => {
    const filename = filepath.slice(filepath.lastIndexOf('/') + 1);

    if (filename) {
        const extension = filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);

        if (mimes[extension]) {
            return mimes[extension];
        }
    }

    return 'application/octet-stream';
};
