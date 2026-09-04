function testLoginDiagnostic() {
  var email = 'superadmin@aef.com';
  var password = 'admin123';
  var userRepo = new UserRepository();
  var allUsers = userRepo.readAll();
  var user = userRepo.findByEmail(email);
  
  if (!user) {
    var rawUser = allUsers.filter(function(u) { return String(u.email).trim().toLowerCase() === email.toLowerCase(); });
    return "User not found. Raw matches: " + JSON.stringify(rawUser);
  }
  
  var status = String(user.status).trim().toUpperCase();
  var todayStr = Utils.formatIsoDate().split('T')[0];
  var expired = user.expired_at;
  var isExpired = user.expired_at && user.expired_at < todayStr;
  var hash = Utils.hashSha256(password);
  var passMatch = user.password_hash === hash;
  
  return JSON.stringify({
    userFound: !!user,
    status: status,
    expired_at_value: expired,
    expired_at_type: typeof expired,
    today: todayStr,
    isExpired: isExpired,
    hash: hash,
    userHash: user.password_hash,
    passMatch: passMatch
  }, null, 2);
}
