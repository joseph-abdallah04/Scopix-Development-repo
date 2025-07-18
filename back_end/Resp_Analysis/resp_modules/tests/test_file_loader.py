import pytest
from file_loader import CSVLoader
import pandas as pd
from pathlib import Path

# 自动创建临时测试数据目录和文件
@pytest.fixture(scope="module")
def sample_dir(tmp_path_factory) -> Path:
    test_dir = tmp_path_factory.mktemp("test_data")

    # 创建 sample1.csv
    df1 = pd.DataFrame({
        '#': [1, 2, 3],
        'R5': [0.1, 0.2, 0.3],
        'X5': [0.4, 0.5, 0.6],
        'Volume': [1.1, 1.2, 1.3]
    })
    df1.to_csv(test_dir / "sample1.csv", sep="\t", index=False)

    # 创建 sample2.csv
    df2 = pd.DataFrame({
        '#': [4, 5, 6],
        'R5': [0.7, 0.8, 0.9],
        'X5': [1.0, 1.1, 1.2],
        'Volume': [1.4, 1.5, 1.6]
    })
    df2.to_csv(test_dir / "sample2.csv", sep="\t", index=False)

    return test_dir


def test_load_single_csv_selected_columns(sample_dir):
    loader = CSVLoader(delimiter='\t', index_col='#', usecols=['#', 'R5', 'Volume'])
    file_path = sample_dir / "sample1.csv"

    df_dict = loader.load(file_path)
    assert isinstance(df_dict, dict)
    assert "sample1" in df_dict

    df = df_dict["sample1"]
    assert isinstance(df, pd.DataFrame)
    assert df.index.name == '#'
    assert df.shape == (3, 2)
    assert 'R5' in df.columns
    assert 'Volume' in df.columns
    assert 'X5' not in df.columns



def test_load_single_csv_all_columns(sample_dir):
    loader = CSVLoader(delimiter='\t', index_col='#')
    file_path = sample_dir / "sample1.csv"

    df_dict = loader.load(file_path)
    assert isinstance(df_dict, dict)
    assert "sample1" in df_dict

    df = df_dict["sample1"]
    assert isinstance(df, pd.DataFrame)
    assert df.index.name == '#'
    assert df.shape == (3, 3)
    assert all(col in df.columns for col in ['R5', 'X5', 'Volume'])



def test_load_batch_csv_all_columns(sample_dir):
    loader = CSVLoader(delimiter='\t', index_col='#')
    dfs = loader.load(sample_dir)

    assert isinstance(dfs, dict)
    assert len(dfs) == 2
    for name, df in dfs.items():
        assert isinstance(df, pd.DataFrame)
        assert df.index.name == '#'
        assert df.shape == (3, 3)


def test_load_batch_csv_selected_columns(sample_dir):
    loader = CSVLoader(delimiter='\t', index_col='#', usecols=['#', 'R5'])
    dfs = loader.load(sample_dir)

    assert isinstance(dfs, dict)
    assert len(dfs) == 2
    for df in dfs.values():
        assert isinstance(df, pd.DataFrame)
        assert df.index.name == '#'
        assert df.shape == (3, 1)
        assert list(df.columns) == ['R5']

def test_load_csv_with_invalid_usecols(sample_dir):
    """测试 usecols 中包含不存在的列"""
    loader = CSVLoader(delimiter='\t', index_col='#', usecols=['#', 'NonExistent'])

    file_path = sample_dir / "sample1.csv"
    with pytest.raises(ValueError) as exc_info:
        loader.load(file_path)

    assert "Usecols do not match columns" in str(exc_info.value) or "Missing column" in str(exc_info.value)


def test_load_csv_with_missing_index_col(sample_dir):
    """测试指定 index_col 不存在"""
    loader = CSVLoader(delimiter='\t', index_col='InvalidIndex')
    file_path = sample_dir / "sample1.csv"

    with pytest.raises(ValueError) as exc_info:
        loader.load(file_path)

    assert "Index" in str(exc_info.value) or "not found" in str(exc_info.value)


def test_load_from_empty_directory(tmp_path):
    """测试空目录的加载"""
    empty_dir = tmp_path / "empty"
    empty_dir.mkdir()

    loader = CSVLoader(delimiter='\t', index_col='#')
    result = loader.load(empty_dir)

    assert result == {}  # 空字典，代表无文件加载


def test_load_from_invalid_path():
    """测试路径不存在"""
    loader = CSVLoader(delimiter='\t', index_col='#')
    with pytest.raises(FileNotFoundError):
        loader.load("nonexistent_path/nowhere.csv")
        
def test_malformed_csv_rows(tmp_path):
    bad_csv = tmp_path / "malformed.csv"
    bad_csv.write_text("#\tR5\tX5\tVolume\n1\t0.1\t0.4\n2\t0.2\t0.5\t1.2\n3\t0.3")  # 第1行少字段，第3行少字段

    loader = CSVLoader(delimiter='\t', index_col='#')

    with pytest.raises(ValueError) as exc_info:
        loader.load(bad_csv)

    assert "Missing values detected" in str(exc_info.value)



def test_csv_with_non_utf8_encoding(tmp_path):
    gbk_csv = tmp_path / "gbk_encoded.csv"

    content = "#\tR5\t备注\n1\t0.1\t正常\n2\t0.2\t异常\n3\t0.3\t缺失\n"
    gbk_csv.write_bytes(content.encode("gbk"))  # 注意 encode

    loader = CSVLoader(delimiter='\t', index_col='#')

    with pytest.raises(ValueError) as exc_info:
        loader.load(gbk_csv)

    assert "codec" in str(exc_info.value).lower() or "utf-8" in str(exc_info.value).lower()

