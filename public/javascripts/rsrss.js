function getHostname(url) {
    return url.split('/')[url.indexOf("//") > -1 ? 2 : 0].split(':')[0].split('?')[0];
}

function getRootDomain(url) {
    return getHostname(url).split('.').filter(x => x.length > 2).join('.');
}