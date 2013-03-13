BLACKLIST = [
    'SetTime',
    'DateTime',
    'ExternalTemperature',
    'CONDUCTIVITY',
    'QUARTZ_PRESSURE_SENSOR_SERIAL_NUMBER',
    'USE_STOP_TIME',
    'USE_START_TIME',
    'IOP_MA',
    'DEVICE_VERSION',
    'LAST_SAMPLE_T',
    'QUARTZ_PRESSURE_SENSOR_RANGE',
    'LAST_SAMPLE_P',
    'LAST_SAMPLE_S',
    'STATUS',
    'LOGGING',
    'SHOW_PROGRESS_MESSAGES',
    'VLITH_V',
    'SERIAL_NUMBER',
    'VMAIN_V',
    # 'Set command not recognized.'
    'TIDE_SAMPLES_PER_DAY',
    'WAVE_BURSTS_PER_DAY',
    'WAVE_BURSTS_SINCE_LAST_START',
    # Todo: troubleshoot why these are problematic, i.e. nulls or invalid floats/types
    'HANNING_WINDOW_CUTOFF',
    'TOTAL_RECORDED_WAVE_BURSTS',
    'TIDE_SAMPLES_BETWEEN_WAVE_BURST_MEASUREMENTS'
]