```sh
curl -X POST http://localhost:3000/api/alarms -H "Content-Type: application/json" -d '{"name": "Test Alarm", "severity": "high"}'

curl http://localhost:3000/api/alarms
```
