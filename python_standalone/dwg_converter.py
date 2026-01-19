"""
DWG to DXF Converter using ODA File Converter.

This is the same converter previously in `miyar_backend/python/dwg_converter.py`,
but placed inside `python_standalone/` so Node can be a server-only wrapper and
all Python logic lives in one place.

CLI:
  python dwg_converter.py <ODA_PATH> <DWG_FILE> [OUTPUT_DIR]
"""

import subprocess
import sys
import os
from pathlib import Path
from typing import Optional

# Store original stdout/stderr for subprocess compatibility
_original_stdout = sys.stdout
_original_stderr = sys.stderr


class DWGConverter:
    """Converts DWG files to DXF format using ODA File Converter."""

    def __init__(self, oda_path: str):
        self.oda_path = Path(oda_path)
        if not self.oda_path.exists():
            raise FileNotFoundError(f"ODA File Converter not found at: {oda_path}")

    def convert(self, dwg_file: str, output_dir: Optional[str] = None) -> str:
        dwg_path = Path(dwg_file).resolve()
        if not dwg_path.exists():
            raise FileNotFoundError(f"DWG file not found: {dwg_file}")

        # Set output directory
        if output_dir is None:
            out_dir = dwg_path.parent
        else:
            out_dir = Path(output_dir).resolve()
            out_dir.mkdir(parents=True, exist_ok=True)

        # Desired final DXF filename
        dxf_file = out_dir / f"{dwg_path.stem}.dxf"

        # ODA converter works on folders, so copy DWG to temp folder
        temp_input_dir = out_dir / "temp_input"
        temp_input_dir.mkdir(exist_ok=True, parents=True)

        import shutil

        temp_dwg = temp_input_dir / dwg_path.name
        shutil.copy2(dwg_path, temp_dwg)

        try:
            oda_exe = str(self.oda_path.resolve())
            input_dir_str = str(temp_input_dir.resolve())
            output_dir_str = str(out_dir.resolve())

            cmd_variants = [
                [oda_exe, input_dir_str, output_dir_str, "ACAD2018", "DXF", "1", "0"],
                [oda_exe, input_dir_str, output_dir_str, "ACAD2018", "DXF", "1"],
                [oda_exe, input_dir_str, output_dir_str, "ACAD2018", "DXF"],
                [oda_exe, input_dir_str, output_dir_str],
                [oda_exe, input_dir_str, output_dir_str, "ACAD2013", "DXF", "1", "0"],
            ]

            result = None
            last_error = None

            for cmd in cmd_variants:
                try:
                    # On Windows, prevent ODA GUI window from showing (run hidden/headless).
                    run_kwargs = {}
                    if os.name == "nt":
                        try:
                            startupinfo = subprocess.STARTUPINFO()
                            startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW
                            startupinfo.wShowWindow = subprocess.SW_HIDE
                            run_kwargs["startupinfo"] = startupinfo
                        except Exception:
                            pass
                        try:
                            run_kwargs["creationflags"] = subprocess.CREATE_NO_WINDOW
                        except Exception:
                            pass

                    result = subprocess.run(
                        cmd,
                        capture_output=True,
                        text=True,
                        encoding="utf-8",
                        errors="replace",
                        timeout=300,
                        shell=False,
                        **run_kwargs,
                    )

                    # log return code (captured by Node stderr)
                    try:
                        _original_stderr.write(f"ODA Converter return code: {result.returncode}\n")
                        _original_stderr.flush()
                    except Exception:
                        pass

                    if result.returncode == 0:
                        # quick check
                        dxf_found = list(out_dir.rglob("*.dxf"))
                        if dxf_found:
                            break
                        last_error = "Return code 0 but no DXF file created."
                    else:
                        last_error = (result.stderr or result.stdout or "").strip()[:500]
                except Exception as e:
                    last_error = str(e)
                    continue

            if result is None:
                raise RuntimeError(f"Failed to run ODA File Converter: {last_error}")

            if result.returncode != 0:
                raise RuntimeError(
                    f"ODA File Converter returned error code {result.returncode}\n"
                    f"stderr: {result.stderr or '(empty)'}\n"
                    f"stdout: {result.stdout or '(empty)'}"
                )

            # Find generated DXF
            generated_dxf = None
            expected = out_dir / f"{dwg_path.stem}.dxf"
            if expected.exists():
                generated_dxf = expected
            else:
                # Sometimes ODA preserves folder structure
                structure_preserved = out_dir / temp_input_dir.name / f"{dwg_path.stem}.dxf"
                if structure_preserved.exists():
                    generated_dxf = structure_preserved
                else:
                    dxfs = list(out_dir.rglob("*.dxf"))
                    if dxfs:
                        # prefer those not in temp_input
                        preferred = [f for f in dxfs if "temp_input" not in str(f)]
                        generated_dxf = preferred[0] if preferred else dxfs[0]

            if not generated_dxf or not generated_dxf.exists():
                raise RuntimeError(f"DXF file was not generated. Expected: {expected}")

            if generated_dxf != dxf_file:
                shutil.move(generated_dxf, dxf_file)

            return str(dxf_file)
        finally:
            if temp_input_dir.exists():
                shutil.rmtree(temp_input_dir, ignore_errors=True)


def main() -> None:
    if len(sys.argv) < 3:
        print("Usage: python dwg_converter.py <ODA_PATH> <DWG_FILE> [OUTPUT_DIR]", file=sys.stderr)
        raise SystemExit(1)

    oda_path = sys.argv[1]
    dwg_file = sys.argv[2]
    output_dir = sys.argv[3] if len(sys.argv) > 3 else None

    converter = DWGConverter(oda_path)
    dxf_file = converter.convert(dwg_file, output_dir)
    print(dxf_file)


if __name__ == "__main__":
    main()


