# Manual Capture Summary

- target: `http://localhost:3000/`
- total requests: `59`
- unique endpoints: `51`

## Methods
- GET: 31
- POST: 16
- PUT: 8
- DELETE: 4

## Status Codes
- 200: 39
- 404: 12
- 500: 8

## Endpoints
- POST /api/auth/login [200]
- GET /api/samples [200]
- GET /api/tasks [500]
- GET /api/equipment [200]
- GET /api/personnel [200]
- GET /api/samples/expiring-retention [200]
- POST /api/samples [500]
- GET /api/personnel/expiring-qualifications [200]
- POST /api/personnel [200]
- PUT /api/personnel/:id [200]
- GET /api/personnel/:id/qualifications [200]
- POST /api/personnel/:id/qualifications [200]
- DELETE /api/personnel/:id/qualifications/:id [404]
- GET /api/personnel/:id/trainings [200]
- POST /api/personnel/:id/trainings [200]
- GET /api/personnel/:id/authorizations [200]
- POST /api/personnel/:id/authorizations [200]
- DELETE /api/personnel/:id [200]
- GET /api/equipment/expiring-calibration [200]
- POST /api/equipment [500]
- GET /api/methods/standards [200]
- GET /api/methods/standards/expiring [200]
- PUT /api/methods/standards/undefined [500]
- GET /api/environment/points [200]
- GET /api/environment/alarms [200]
- POST /api/environment/points [200]
- GET /api/environment/alarm-rules [200]
- PUT /api/environment/points/:id [200]
- DELETE /api/environment/points/:id [404]
- GET /api/documents [200]
- POST /api/documents [200]
- PUT /api/documents/:id [500]
- GET /api/documents/:id/revisions [200]
- POST /api/documents/:id/revisions [200]
- PUT /api/documents/:id/publish [200]
- PUT /api/documents/:id/archive [200]
- DELETE /api/documents/:id [200]
- GET /api/quality/control-samples [200]
- GET /api/quality/internal-audits [200]
- GET /api/quality/management-reviews [200]
- POST /api/quality/control-samples [200]
- PUT /api/quality/audits/undefined [404]
- PUT /api/quality/reviews/undefined [404]
- GET /api/system/users [404]
- GET /api/system/roles [404]
- POST /api/system/users [404]
- POST /api/system/roles [404]
- GET /api/system/logs [404]
- GET /api/system/config [404]
- GET /api/system/backup [404]
- POST /api/system/backup [404]
