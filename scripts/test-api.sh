#!/usr/bin/env bash
# API integration tests vs the running dev server + real MySQL.
# Run: npm run test:api   (server must be up on $BASE)
#
# Windows note: Thai text must never pass through external-program argv
# (curl.exe/python.exe mangle non-ASCII argv). Payloads therefore go via
# stdin heredocs (--data-binary @-) and comparisons happen in bash.
#
# Self-cleaning where the API allows; incomes/rentals/payouts have no DELETE
# endpoints — run `npm run seed` afterwards for pristine demo data.

export PYTHONUTF8=1
BASE=${BASE:-http://localhost:3210}
CJ=$(mktemp) ; VJ=$(mktemp)
PASS=0; FAIL=0

t() { # t <name> <want> <got>
  if [ "$2" = "$3" ]; then PASS=$((PASS+1)); echo "PASS $1"
  else FAIL=$((FAIL+1)); echo "FAIL $1 (want='$2' got='$3')"; fi
}
post()  { curl -s -b "$CJ" -X POST   "$BASE$1" -H 'Content-Type: application/json' --data-binary @-; }
patch() { curl -s -b "$CJ" -X PATCH  "$BASE$1" -H 'Content-Type: application/json' --data-binary @-; }
del()   { curl -s -b "$CJ" -X DELETE "$BASE$1"; }
get()   { curl -s -b "$CJ" "$BASE$1"; }
code()  { python -c "import sys,json;d=json.load(sys.stdin);print(d.get('error',{}).get('code') if not d.get('ok') else 'OK')" 2>/dev/null; }
newid() { python -c "import sys,json;print(json.load(sys.stdin)['data']['id'])" 2>/dev/null; }

echo "== A. AUTH & RBAC =="
LOGIN=$(curl -s -c "$CJ" -X POST "$BASE/api/auth/login" -H 'Content-Type: application/json' --data-binary @- <<'EOF'
{"email":"admin@armay.local","password":"owner123!"}
EOF
)
t "A1 login admin" "OK" "$(echo "$LOGIN" | code)"
BAD=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/api/auth/login" -H 'Content-Type: application/json' -d '{"email":"admin@armay.local","password":"wrong"}')
t "A2 login รหัสผิด -> 401" "401" "$BAD"
t "A3 API ไม่มี cookie -> 401" "401" "$(curl -s -o /dev/null -w '%{http_code}' "$BASE/api/owners")"
t "A4 หน้าไม่ login -> redirect" "307" "$(curl -s -o /dev/null -w '%{http_code}' "$BASE/dashboard")"
curl -s -c "$VJ" -X POST "$BASE/api/auth/login" -H 'Content-Type: application/json' -d '{"email":"viewer@armay.local","password":"view123!"}' >/dev/null
VPOST=$(curl -s -b "$VJ" -X POST "$BASE/api/owners" -H 'Content-Type: application/json' -d '{"fullName":"x"}' | code)
t "A5 VIEWER สร้างข้อมูล -> FORBIDDEN" "FORBIDDEN" "$VPOST"
t "A6 /me role" "ADMIN" "$(get /api/auth/me | python -c "import sys,json;print(json.load(sys.stdin)['data']['user']['role'])" 2>/dev/null)"

echo "== B. MASTER DATA CRUD =="
t "B1 owners list ไม่ว่าง" "True" "$(get /api/owners | python -c "import sys,json;print(len(json.load(sys.stdin)['data'])>0)")"
OID=$(post /api/owners <<'EOF' | newid
{"fullName":"ทดสอบ เจ้าของ","phone":"0812223333","bankName":"KBank","bankAccountNumber":"111-2-33333-4"}
EOF
)
t "B2 owner create" "1" "$([ -n "$OID" ] && echo 1)"
t "B3 owner update" "OK" "$(patch /api/owners/$OID <<'EOF' | code
{"phone":"0899998888"}
EOF
)"
t "B4 owner delete" "OK" "$(del /api/owners/$OID | code)"
FIRSTOWNER=$(get /api/owners | python -c "import sys,json;print(json.load(sys.stdin)['data'][0]['id'])")
t "B5 ลบเจ้าของที่มีห้อง -> 409" "HAS_DEPENDENTS" "$(del /api/owners/$FIRSTOWNER | code)"
t "B6 validation ว่าง -> 400" "VALIDATION" "$(post /api/owners <<'EOF' | code
{"fullName":""}
EOF
)"
TID=$(post /api/tenants <<'EOF' | newid
{"fullName":"ทดสอบ ผู้เช่า"}
EOF
)
t "B7 tenant create+delete" "OK" "$(del /api/tenants/$TID | code)"
FIRSTTENANT=$(get /api/tenants | python -c "import sys,json;print(json.load(sys.stdin)['data'][0]['id'])")
t "B8 ลบผู้เช่าที่มีสัญญา -> 409" "HAS_DEPENDENTS" "$(del /api/tenants/$FIRSTTENANT | code)"
AID=$(post /api/payment-accounts <<'EOF' | newid
{"accountName":"บัญชีทดสอบ","accountType":"รับผู้เช่า","bankName":"SCB"}
EOF
)
t "B9 account create+delete" "OK" "$(del /api/payment-accounts/$AID | code)"
PID=$(post /api/properties <<'EOF' | newid
{"propertyName":"อาคารทดสอบ","propertyType":"คอนโด","province":"กรุงเทพมหานคร","latitude":"13.7398000","longitude":"100.5804000"}
EOF
)
t "B10 property create (lat/long)" "1" "$([ -n "$PID" ] && echo 1)"
t "B11 property delete" "OK" "$(del /api/properties/$PID | code)"
t "B12 rooms list + rent field" "True" "$(get /api/rooms | python -c "import sys,json;d=json.load(sys.stdin)['data'];print(len(d)>0 and 'rent' in d[0])")"

echo "== C. TRANSACTIONS =="
t "C1 incomes list+summary" "True" "$(get /api/incomes | python -c "import sys,json;d=json.load(sys.stdin)['data'];print('rows' in d and 'summary' in d)")"
CID=$(get /api/rentals | python -c "import sys,json;print(json.load(sys.stdin)['data'][0]['id'])")
INCBODY=$(cat <<EOF
{"contractId":$CID,"incomeDate":"7 ก.ค. 2569","incomeType":"OTHER","amount":9999,"paymentMethod":"CASH","transactionReference":"TEST-GOAL-1"}
EOF
)
t "C2 income create" "OK" "$(echo "$INCBODY" | post /api/incomes | code)"
t "C3 income ซ้ำ -> 409" "DUPLICATE_INCOME" "$(echo "$INCBODY" | post /api/incomes | code)"
EID=$(post /api/expenses <<'EOF' | newid
{"date":"7 ก.ค. 2569","room":"A-1105","expenseType":"ค่าวัสดุ","description":"ทดสอบ","payeeName":"ร้านทดสอบ","amount":"123","responsibility":"นายหน้า","status":"รอจ่าย","beforeUrl":null,"afterUrl":null}
EOF
)
t "C4 expense create" "1" "$([ -n "$EID" ] && echo 1)"
t "C5 expense update" "OK" "$(patch /api/expenses/$EID <<'EOF' | code
{"date":"7 ก.ค. 2569","room":"A-1105","expenseType":"ค่าวัสดุ","description":"แก้แล้ว","payeeName":"ร้านทดสอบ","amount":"456","responsibility":"นายหน้า","status":"จ่ายแล้ว","beforeUrl":null,"afterUrl":null}
EOF
)"
t "C6 expense delete" "OK" "$(del /api/expenses/$EID | code)"
t "C7 expense ห้องผิด -> 400" "ROOM_NOT_FOUND" "$(post /api/expenses <<'EOF' | code
{"date":"7 ก.ค. 2569","room":"NO-ROOM","expenseType":"ค่าวัสดุ","description":"x","payeeName":"y","amount":"1","responsibility":"นายหน้า","status":"รอจ่าย","beforeUrl":null,"afterUrl":null}
EOF
)"
TEN=$(get /api/tenants | python -c "import sys,json;print(json.load(sys.stdin)['data'][0]['id'])")
ROOM=$(get /api/rooms | python -c "import sys,json;print(json.load(sys.stdin)['data'][0]['id'])")
RENTBODY=$(cat <<EOF
{"tenantId":$TEN,"roomId":$ROOM,"rentalType":"MONTHLY","startDate":"1 ส.ค. 2569","endDate":"31 ส.ค. 2569","rentAmount":12000,"depositAmount":0,"cleaningFee":0,"otherFee":0,"discountAmount":0,"bookingChannel":"test","note":"integration test"}
EOF
)
RID=$(echo "$RENTBODY" | post /api/rentals | newid)
t "C8 rental create" "1" "$([ -n "$RID" ] && echo 1)"
DTOTAL=$(get /api/rentals/$RID | python -c "import sys,json;d=json.load(sys.stdin)['data'];print(d['total'])" 2>/dev/null)
t "C9 rental detail total" "฿12,000" "$DTOTAL"
OWN=$(get /api/owners | python -c "import sys,json;print(json.load(sys.stdin)['data'][0]['id'])")
t "C10 payout preview+suggest" "True" "$(get "/api/payouts/preview?ownerId=$OWN" | python -c "import sys,json;d=json.load(sys.stdin)['data'];print(d['suggestedCommission']>=0 and d['gross']>=0)")"
PAYBODY=$(cat <<EOF
{"ownerId":$OWN,"payoutDate":"7 ก.ค. 2569","grossIncomeAmount":1000,"commissionAmount":100,"deductions":[],"paymentMethod":"CASH","ownerBankAccount":"","note":"integration test"}
EOF
)
PAYID=$(echo "$PAYBODY" | post /api/payouts | newid)
t "C11 payout create" "1" "$([ -n "$PAYID" ] && echo 1)"
PAYLINES=$(get /api/payouts | python -c "import sys,json;[print(r['income'],r['net']) for r in json.load(sys.stdin)['data']['rows']]")
case "$PAYLINES" in *"฿1,000 ฿900"*) NETOK=yes;; *) NETOK=no;; esac
t "C12 payout net 1000-100 = ฿900" "yes" "$NETOK"

echo "== D. USERS & AUDIT =="
UID2=$(post /api/users <<'EOF' | newid
{"fullName":"ทดสอบ ยูสเซอร์","email":"testgoal@armay.local","role":"VIEWER","status":"ACTIVE"}
EOF
)
t "D1 user create" "1" "$([ -n "$UID2" ] && echo 1)"
t "D2 user update" "OK" "$(patch /api/users/$UID2 <<'EOF' | code
{"fullName":"ทดสอบ แก้ชื่อ"}
EOF
)"
t "D3 user delete" "OK" "$(del /api/users/$UID2 | code)"
ADMINID=$(get /api/users | python -c "import sys,json;print(next(u['id'] for u in json.load(sys.stdin)['data'] if u['role']=='ADMIN'))")
t "D4 ลบ ADMIN คนสุดท้าย -> 409" "LAST_ADMIN" "$(del /api/users/$ADMINID | code)"
t "D5 audit log ไม่ว่าง" "True" "$(get /api/audit | python -c "import sys,json;print(len(json.load(sys.stdin)['data'])>0)")"
t "D6 VIEWER อ่าน users -> 403" "403" "$(curl -s -b "$VJ" -o /dev/null -w '%{http_code}' "$BASE/api/users")"

echo "== E. DASHBOARD & REPORTS =="
t "E1 dashboard kpis+charts" "True" "$(get /api/dashboard | python -c "import sys,json;d=json.load(sys.stdin)['data'];print('kpis' in d and 'urgent' in d and len(d['charts']['line']['months'])==12)")"
t "E2 reports byMonth/byProperty" "True" "$(get /api/reports | python -c "import sys,json;d=json.load(sys.stdin)['data'];print(len(d['byMonth'])==6 and len(d['byProperty'])>0)")"

rm -f "$CJ" "$VJ"
echo ""
echo "==== $PASS passed, $FAIL failed ===="
[ $FAIL -eq 0 ]
