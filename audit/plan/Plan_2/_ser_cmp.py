import io, re, glob, os

entities = ['Loan','Payment','Application','Customer','Guarantor','BoccMeeting','SanctionLetter',
            'LoanProduct','WriteOff','CtrReport','MonitoringAlert','WorkflowTask','OtpRequest',
            'Collateral','StrReport','RecoveryEntry','NotificationTemplate','NotificationDelivery']
for e in entities:
    hits = glob.glob(rf'apps\api\src\main\java\com\uslbd\ulms\**\{e}.java', recursive=True)
    if not hits:
        print(f"{e:22} NOT FOUND")
        continue
    s = io.open(hits[0], encoding='utf-8').read()
    body = s[s.find('class'):]
    flds = re.findall(r'private (?:final )?[\w.<>\[\] ]+? (\w+)(?: = [^;]+)?;', body)
    getters = {g.lower() for g in re.findall(r'public [\w.<>\[\]]+ get(\w+)\(', body)}
    missing = [f for f in flds if f not in getters]
    print(f"{e:22} fields={len(flds):2}  getters={len(getters):2}  missing: {missing if missing else 'none'}")
