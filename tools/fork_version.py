"""Keep reviewed fork candidates on plain, increasing X.Y.Z versions."""
import json
import re
import subprocess
from pathlib import Path


def parse(value):
    if not isinstance(value, str) or not re.fullmatch(r'(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)', value):
        raise ValueError('Expected X.Y.Z version')
    return tuple(map(int, value.split('.')))


def choose(current, merged):
    old, new = parse(current), parse(merged)
    return merged if new > old else f'{old[0]}.{old[1]}.{old[2] + 1}'


def main():
    root = Path(__file__).resolve().parents[1]
    old = json.loads(subprocess.check_output(['git', 'show', 'HEAD:package.json'], cwd=root).decode('utf-8'))
    path = root / 'package.json'
    package = json.loads(path.read_text(encoding='utf-8'))
    version = choose(old['version'], package['version'])
    package['version'] = version
    path.write_text(json.dumps(package, indent=2) + '\n', encoding='utf-8', newline='\n')
    lock = root / 'package-lock.json'
    if lock.exists():
        data = json.loads(lock.read_text(encoding='utf-8'))
        data['version'] = version
        if '' in data.get('packages', {}):
            data['packages']['']['version'] = version
        lock.write_text(json.dumps(data, indent=2) + '\n', encoding='utf-8', newline='\n')
    print(version)


if __name__ == '__main__':
    main()
