#!/usr/bin/env python3
"""
Простой скрипт для тестирования RTMP валидации
"""
import socket
import time

def test_rtmp_connection(stream_key, server="localhost", port=1935):
    """
    Попытка подключиться к RTMP серверу с заданным ключом
    """
    print(f"🔄 Testing RTMP connection with stream key: {stream_key}")
    
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(5)
        
        print(f"📡 Connecting to {server}:{port}...")
        sock.connect((server, port))
        print(f"✅ Connected to RTMP server")
        
        # Отправляем базовый RTMP handshake
        # RTMP Protocol: первый байт = версия протокола (3)
        handshake = b'\x03' + b'\x00' * 1536
        sock.send(handshake)
        print(f"📤 Sent RTMP handshake")
        
        # Получаем ответ
        response = sock.recv(1537)
        print(f"📥 Received response: {len(response)} bytes")
        
        # Отправляем второй handshake
        sock.send(b'\x00' * 1536)
        print(f"📤 Sent second handshake")
        
        # Получаем подтверждение
        response = sock.recv(1536)
        print(f"📥 Received confirmation: {len(response)} bytes")
        
        # Построим AMF0 CONNECT команду для на с ключом потока
        # Это упрощённая версия - реальный OBS отправляет больше данных
        connect_cmd = b'\x00\x00\x00\x00\x00\x00\x00\x01\x00'  # RtmpHeader
        connect_cmd += b'\x14'  # Message type = 20 (CommandMessage)
        
        sock.send(connect_cmd[:100])  # Отправим часть
        print(f"📤 Sent connect command")
        
        # Слушаем ответ
        sock.settimeout(2)
        try:
            response = sock.recv(4096)
            print(f"📥 Response: {response[:100]}")
        except socket.timeout:
            print(f"⏱️  No response (timeout)")
        
        sock.close()
        print(f"✅ Connection test completed")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    print("=" * 50)
    print("RTMP Validation Test")
    print("=" * 50)
    
    # Тест 1: правильный ключ (нужно получить из БД)
    print("\n[TEST 1] Testing with INVALID stream key...")
    test_rtmp_connection("invalid_key_12345")
    
    print("\n" + "=" * 50)
    print("Done!")
