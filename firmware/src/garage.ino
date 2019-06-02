/*
 * Project garage
 * Description: Trigger the garage door opener from a P1-based hardware board
 * Author: Julien Vanier
 */

#include "FiniteStateMachine.h"

constexpr auto RELAY = D3;
constexpr auto SENSOR = D1;

constexpr auto SENSOR_OPEN = HIGH;
constexpr auto SENSOR_DEBOUNCE_TIME = 500;

constexpr auto RELAY_ACTIVE_TIME = 100;
constexpr auto RELAY_INACTIVE = LOW;
constexpr auto RELAY_ACTIVE = HIGH;

enum {
  CLOSED,
  OPEN
} doorState;

String doorStateString;

uint8_t relayToggleRequest = 0;

/**********************************************************************************
 * State machines
 **********************************************************************************/

State ReadSensorState(readSensor);
State DebounceSensorState(debounceSensor);

FSM SensorFSM(ReadSensorState);

State RelayInactiveState(deactivateRelay, relayInactive, nullptr);
State RelayActiveState(activateRelay, relayActive, nullptr);

FSM RelayFSM(RelayInactiveState);

/**********************************************************************************
 * SETUP
 **********************************************************************************/
void setup() {
  setupHardware();
  setupCloud();
}

void setupHardware() {
  pinMode(RELAY, OUTPUT);
  digitalWrite(RELAY, RELAY_INACTIVE);

  pinMode(SENSOR, INPUT_PULLUP);
}
int sensorDebug = 0;
void setupCloud() {
  Particle.variable("doorState", doorStateString);
  Particle.function("toggleDoor", toggleDoor);

  Particle.variable("sensor", sensorDebug);
}

/**********************************************************************************
 * LOOP
 **********************************************************************************/
void loop() {
  sensorDebug = digitalRead(SENSOR);
  SensorFSM.update();
  RelayFSM.update();
}

void readSensor() {
  static bool initial = true;
  static auto previousSensor = SENSOR_OPEN;

  auto sensor = (PinState) digitalRead(SENSOR);

  if (initial || sensor != previousSensor) {
    if (sensor == SENSOR_OPEN) {
      doorState = OPEN;
      doorStateString = "open";
    } else {
      doorState = CLOSED;
      doorStateString = "closed";
    }

    if (!initial) {
      Particle.publish("garage/state", doorStateString, PRIVATE);
      SensorFSM.transitionTo(DebounceSensorState);
    }
    previousSensor = sensor;
    initial = false;
  }
}

void debounceSensor() {
  if (SensorFSM.timeInCurrentState() >= SENSOR_DEBOUNCE_TIME) {
    SensorFSM.transitionTo(ReadSensorState);
  }
}

int toggleDoor(String) {
  relayToggleRequest++;
  return relayToggleRequest;
}

void deactivateRelay() {
  digitalWrite(RELAY, RELAY_INACTIVE);
  if (relayToggleRequest > 0) {
    relayToggleRequest--;
  }
}

void relayInactive() {
  if (RelayFSM.timeInCurrentState() >= RELAY_ACTIVE_TIME && relayToggleRequest > 0) {
    RelayFSM.transitionTo(RelayActiveState);
  }
}

void activateRelay() {
  digitalWrite(RELAY, RELAY_ACTIVE);
}

void relayActive() {
  if (RelayFSM.timeInCurrentState() >= RELAY_ACTIVE_TIME) {
    RelayFSM.transitionTo(RelayInactiveState);
  }
}