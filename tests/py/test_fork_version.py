import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('fork_version', Path(__file__).resolve().parents[2] / 'tools/fork_version.py')
version = importlib.util.module_from_spec(spec)
spec.loader.exec_module(version)


class ForkVersionTests(unittest.TestCase):
    def test_upstream_newer_keeps_plain_release(self):
        self.assertEqual(version.choose('2.22.4', '2.23.0'), '2.23.0')

    def test_same_or_older_upstream_never_reuses_or_downgrades_fork(self):
        self.assertEqual(version.choose('2.22.4', '2.22.4'), '2.22.5')
        self.assertEqual(version.choose('2.22.4', '2.22.3'), '2.22.5')

    def test_invalid_or_prerelease_number_is_not_published(self):
        for value in ['2.1', 'v2.1.3', '2.1.3+abc', '2.1.3-beta.1', '02.1.3', None]:
            with self.assertRaises(ValueError):
                version.parse(value)
