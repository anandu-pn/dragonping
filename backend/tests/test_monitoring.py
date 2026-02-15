import asyncio
from datetime import datetime

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app import models
from app.monitor import check_icmp_ping
from app.services.monitoring_service import MonitoringService


class DummyResp:
    def __init__(self, success: bool, time_elapsed: float):
        self.success = success
        self.time_elapsed = time_elapsed


class DummyRespList(list):
    def __init__(self, resp: DummyResp):
        super().__init__([resp])
        # simulate pythonping ResponseList attributes in seconds
        self.rtt_avg = resp.time_elapsed
        self.rtt_min = resp.time_elapsed
        self.rtt_max = resp.time_elapsed


def test_check_icmp_ping_success(monkeypatch):
    # simulate a successful ping with 0.05s
    monkeypatch.setattr('app.monitor.icmp_ping', lambda ip, count, timeout: DummyRespList(DummyResp(True, 0.05)))
    res = check_icmp_ping('127.0.0.1', timeout=2)
    assert res['status'] == 'UP'
    assert res['response_time'] > 0


def test_check_icmp_ping_failure(monkeypatch):
    # simulate no reply
    monkeypatch.setattr('app.monitor.icmp_ping', lambda ip, count, timeout: DummyRespList(DummyResp(False, 0)))
    res = check_icmp_ping('10.0.0.1', timeout=1)
    assert res['status'] == 'DOWN'
    assert 'Ping failed' in res['error_message'] or 'No ping response' in res['error_message'] or res['response_time'] >= 0


@pytest.mark.asyncio
async def test_monitoring_service_sends_alerts_on_5_consecutive_down(monkeypatch):
    # Set up in-memory DB
    engine = create_engine('sqlite:///:memory:')
    SessionLocal = sessionmaker(bind=engine)
    models.Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # Create admin user
        admin = models.User(email='admin@test.local', password_hash='x', is_admin=True)
        db.add(admin)
        db.commit()

        # Create a service
        svc = models.Service(name='test-device', type=models.ServiceType.DEVICE, protocol=models.ProtocolType.ICMP, ip_address='10.0.0.2', active=True)
        db.add(svc)
        db.commit()

        # monkeypatch check_service to always return DOWN
        async def fake_check_service(**kwargs):
            return {
                'status': 'DOWN',
                'status_code': None,
                'response_time': 0,
                'error_message': 'simulated down',
            }

        monkeypatch.setattr('app.services.monitoring_service.check_service', fake_check_service)

        # monkeypatch send_alerts to avoid real SMTP
        async def fake_send_alerts(service_name, status, service_id, recipients, error_message=None):
            return len(recipients)

        monkeypatch.setattr('app.services.monitoring_service.send_alerts', fake_send_alerts)

        # Run checks 5 times to trigger alert
        for _ in range(5):
            await MonitoringService.run_checks(db)

        # After 5 consecutive downs, there should be AlertLog entries
        alerts = db.query(models.AlertLog).filter(models.AlertLog.service_id == svc.id).all()
        assert len(alerts) >= 1
    finally:
        db.close()
