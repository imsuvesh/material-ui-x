import * as React from 'react';
import { createRenderer, fireEvent, screen } from '@mui/monorepo/test/utils';
import { expect } from 'chai';
import { DataGrid, DataGridProps, GridInputSelectionModel } from '@mui/x-data-grid';
import {
  getCell,
  getRow,
  getRows,
  getColumnHeaderCell,
  getColumnHeadersTextContent,
} from 'test/utils/helperFn';
import { getData } from 'storybook/src/data/data-service';
import { spy } from 'sinon';

const isJSDOM = /jsdom/.test(window.navigator.userAgent);

function getSelectedRowIds() {
  const hasCheckbox = !!document.querySelector('input[type="checkbox"]');
  return [...getRows()]
    .filter((row) => row.classList.contains('Mui-selected'))
    .map((row) =>
      Number(
        row.querySelector(`[role="cell"][data-colindex="${hasCheckbox ? 1 : 0}"]`)!.textContent,
      ),
    );
}

describe('<DataGrid /> - Selection', () => {
  const { render } = createRenderer();

  const defaultData = getData(4, 2);

  const TestDataGridSelection = (
    props: Omit<DataGridProps, 'rows' | 'columns'> &
      Partial<Pick<DataGridProps, 'rows' | 'columns'>>,
  ) => (
    <div style={{ width: 300, height: 300 }}>
      <DataGrid {...defaultData} {...props} autoHeight={isJSDOM} />
    </div>
  );

  describe('props: checkboxSelection = false (single selection)', () => {
    it('should select one row at a time on click WITHOUT ctrl or meta pressed', () => {
      render(<TestDataGridSelection />);
      fireEvent.click(getCell(0, 0));
      expect(getSelectedRowIds()).to.deep.equal([0]);
      fireEvent.click(getCell(1, 0));
      expect(getSelectedRowIds()).to.deep.equal([1]);
    });

    it(`should not deselect the selected row on click WITHOUT ctrl or meta pressed`, () => {
      render(<TestDataGridSelection />);
      fireEvent.click(getCell(0, 0));
      expect(getSelectedRowIds()).to.deep.equal([0]);
      fireEvent.click(getCell(0, 0));
      expect(getSelectedRowIds()).to.deep.equal([0]);
    });

    ['metaKey', 'ctrlKey'].forEach((key) => {
      it(`should select one row at a time on click WITH ${key} pressed`, () => {
        render(<TestDataGridSelection />);
        fireEvent.click(getCell(0, 0), { [key]: true });
        expect(getSelectedRowIds()).to.deep.equal([0]);
        fireEvent.click(getCell(1, 0), { [key]: true });
        expect(getSelectedRowIds()).to.deep.equal([1]);
      });

      it(`should deselect the selected row on click WITH ${key} pressed`, () => {
        render(<TestDataGridSelection />);
        fireEvent.click(getCell(0, 0));
        expect(getSelectedRowIds()).to.deep.equal([0]);
        fireEvent.click(getCell(0, 0), { [key]: true });
        expect(getSelectedRowIds()).to.deep.equal([]);
      });
    });

    it('should not select a range with shift pressed', () => {
      render(<TestDataGridSelection />);
      fireEvent.click(getCell(0, 0));
      expect(getSelectedRowIds()).to.deep.equal([0]);
      fireEvent.click(getCell(2, 0), { shiftKey: true });
      expect(getSelectedRowIds()).to.deep.equal([2]);
    });
  });

  describe('props: checkboxSelection = false (single selection), with keyboard events', () => {
    it('should select one row at a time on Shift + Space', () => {
      render(<TestDataGridSelection />);

      const cell0 = getCell(0, 0);
      cell0.focus();
      fireEvent.keyDown(cell0, { key: ' ', shiftKey: true });
      expect(getSelectedRowIds()).to.deep.equal([0]);

      const cell1 = getCell(1, 0);
      cell1.focus();
      fireEvent.keyDown(cell1, { key: ' ', shiftKey: true });
      expect(getSelectedRowIds()).to.deep.equal([1]);
    });

    it('should select row on Shift + Space without starting editing the cell', () => {
      const onCellEditStart = spy();
      render(
        <TestDataGridSelection
          columns={[
            { field: 'id', type: 'number' },
            { field: 'name', editable: true },
          ]}
          rows={[
            { id: 0, name: 'React' },
            { id: 1, name: 'Vue' },
          ]}
          onCellEditStart={onCellEditStart}
        />,
      );
      expect(onCellEditStart.callCount).to.equal(0);

      const cell01 = getCell(0, 1);
      cell01.focus();
      fireEvent.keyDown(cell01, { key: ' ', shiftKey: true });

      expect(onCellEditStart.callCount).to.equal(0);
      expect(getSelectedRowIds()).to.deep.equal([0]);

      const cell11 = getCell(1, 1);
      cell11.focus();
      fireEvent.keyDown(cell11, { key: ' ', shiftKey: true });

      expect(onCellEditStart.callCount).to.equal(0);
      expect(getSelectedRowIds()).to.deep.equal([1]);
    });

    it(`should deselect the selected row on Shift + Space`, () => {
      render(<TestDataGridSelection />);
      const cell00 = getCell(0, 0);
      cell00.focus();

      fireEvent.keyDown(cell00, { key: ' ', shiftKey: true });
      expect(getSelectedRowIds()).to.deep.equal([0]);

      fireEvent.keyDown(cell00, { key: ' ', shiftKey: true });
      expect(getSelectedRowIds()).to.deep.equal([]);
    });

    it('should not select a range with shift pressed', () => {
      render(<TestDataGridSelection />);
      const cell00 = getCell(0, 0);
      cell00.focus();

      fireEvent.keyDown(cell00, { key: ' ', shiftKey: true });
      expect(getSelectedRowIds()).to.deep.equal([0]);

      fireEvent.keyDown(cell00, {
        key: 'ArrowDown',
        shiftKey: true,
      });

      expect(getSelectedRowIds()).to.deep.equal([0]);
    });
  });

  describe('prop: checkboxSelection = true (multi selection)', () => {
    it('should allow to toggle prop.checkboxSelection', () => {
      const { setProps } = render(<TestDataGridSelection />);
      expect(getColumnHeadersTextContent()).to.deep.equal(['id', 'Currency Pair']);
      expect(getColumnHeaderCell(0).querySelectorAll('input')).to.have.length(0);
      setProps({ checkboxSelection: true });
      expect(getColumnHeadersTextContent()).to.deep.equal(['', 'id', 'Currency Pair']);
      expect(getColumnHeaderCell(0).querySelectorAll('input')).to.have.length(1);
    });

    it('should check and uncheck when double clicking the row', () => {
      render(<TestDataGridSelection checkboxSelection />);
      expect(getSelectedRowIds()).to.deep.equal([]);
      expect(getRow(0).querySelector('input')).to.have.property('checked', false);

      fireEvent.click(getCell(0, 0));
      expect(getSelectedRowIds()).to.deep.equal([0]);
      expect(getRow(0).querySelector('input')).to.have.property('checked', true);

      fireEvent.click(getCell(0, 0));
      expect(getSelectedRowIds()).to.deep.equal([]);
      expect(getRow(0).querySelector('input')).to.have.property('checked', false);
    });

    it('should select all visible rows regardless of pagination', () => {
      render(<TestDataGridSelection checkboxSelection pageSize={1} rowsPerPageOptions={[1]} />);
      const selectAllCheckbox = document.querySelector('input[type="checkbox"]');
      fireEvent.click(selectAllCheckbox);
      expect(getSelectedRowIds()).to.deep.equal([0]);
      fireEvent.click(screen.getByRole('button', { name: /next page/i }));
      expect(getSelectedRowIds()).to.deep.equal([1]);
    });

    it('should check the checkbox when there is no rows', () => {
      render(<TestDataGridSelection rows={[]} checkboxSelection />);
      const selectAll = screen.getByRole('checkbox', {
        name: /select all rows checkbox/i,
      });
      expect(selectAll).to.have.property('checked', false);
    });

    it('should disable the checkbox if isRowSelectable returns false', () => {
      render(
        <TestDataGridSelection isRowSelectable={(params) => params.id === 0} checkboxSelection />,
      );
      expect(getRow(0).querySelector('input')).to.have.property('disabled', false);
      expect(getRow(1).querySelector('input')).to.have.property('disabled', true);
    });

    it('should select a range with shift pressed when clicking the row', () => {
      render(<TestDataGridSelection checkboxSelection />);
      fireEvent.click(getCell(0, 1));
      expect(getSelectedRowIds()).to.deep.equal([0]);
      fireEvent.click(getCell(2, 1), { shiftKey: true });
      expect(getSelectedRowIds()).to.deep.equal([0, 1, 2]);
    });

    it('should select a range with shift pressed when clicking the checkbox', () => {
      render(<TestDataGridSelection checkboxSelection />);
      fireEvent.click(getCell(0, 0).querySelector('input'));
      expect(getSelectedRowIds()).to.deep.equal([0]);
      fireEvent.click(getCell(2, 0).querySelector('input'), { shiftKey: true });
      expect(getSelectedRowIds()).to.deep.equal([0, 1, 2]);
    });

    it('should unselect from last clicked cell to cell after clicked cell if clicking inside a selected range', () => {
      render(<TestDataGridSelection checkboxSelection />);
      fireEvent.click(getCell(0, 0));
      expect(getSelectedRowIds()).to.deep.equal([0]);
      fireEvent.click(getCell(3, 0), { shiftKey: true });
      expect(getSelectedRowIds()).to.deep.equal([0, 1, 2, 3]);
      fireEvent.click(getCell(1, 0), { shiftKey: true });
      expect(getSelectedRowIds()).to.deep.equal([0, 1]);
    });
  });

  describe('prop: checkboxSelection = true (multi selection), with keyboard events', () => {
    it('should select a range with shift pressed when pressing ArrowDown', () => {
      render(<TestDataGridSelection checkboxSelection />);

      expect(getSelectedRowIds()).to.deep.equal([]);

      const cell01 = getCell(0, 1);
      cell01.focus();
      fireEvent.keyDown(cell01, {
        key: 'ArrowDown',
        shiftKey: true,
      });

      expect(getSelectedRowIds()).to.deep.equal([0, 1]);

      const cell11 = getCell(1, 1);
      fireEvent.keyDown(cell11, {
        key: 'ArrowDown',
        shiftKey: true,
      });

      expect(getSelectedRowIds()).to.deep.equal([0, 1, 2]);
    });

    it('should select a range with shift pressed when pressing ArrowUp', () => {
      render(<TestDataGridSelection checkboxSelection />);
      expect(getSelectedRowIds()).to.deep.equal([]);

      const cell21 = getCell(2, 1);
      cell21.focus();
      fireEvent.keyDown(cell21, {
        key: 'ArrowUp',
        shiftKey: true,
      });
      expect(getSelectedRowIds()).to.deep.equal([1, 2]);

      const cell11 = getCell(1, 1);
      fireEvent.keyDown(cell11, {
        key: 'ArrowUp',
        shiftKey: true,
      });
      expect(getSelectedRowIds()).to.deep.equal([0, 1, 2]);
    });

    it('should add new row to the selection when pressing Shift+Space', () => {
      render(<TestDataGridSelection checkboxSelection />);

      expect(getSelectedRowIds()).to.deep.equal([]);

      const cell21 = getCell(2, 1);
      cell21.focus();
      fireEvent.keyDown(cell21, {
        key: ' ',
        shiftKey: true,
      });

      expect(getSelectedRowIds()).to.deep.equal([2]);

      const cell11 = getCell(1, 1);
      cell11.focus();
      fireEvent.keyDown(cell11, {
        key: ' ',
        shiftKey: true,
      });
      expect(getSelectedRowIds()).to.deep.equal([1, 2]);
    });

    it('should not jump during scroll while the focus is on the checkbox', function test() {
      if (isJSDOM) {
        this.skip(); // HTMLElement.focus() only scrolls to the element on a real browser
      }
      const data = getData(20, 1);
      render(<TestDataGridSelection {...data} rowHeight={50} checkboxSelection hideFooter />);
      const checkboxes = screen.queryAllByRole('checkbox', { name: /select row checkbox/i });
      checkboxes[0].focus();
      fireEvent.keyDown(checkboxes[0], { key: 'ArrowDown' });
      fireEvent.keyDown(checkboxes[1], { key: 'ArrowDown' });
      fireEvent.keyDown(checkboxes[2], { key: 'ArrowDown' });
      const virtualScroller = document.querySelector('.MuiDataGrid-virtualScroller')!;
      virtualScroller.scrollTop = 250; // Scroll 5 rows
      virtualScroller.dispatchEvent(new Event('scroll'));
      expect(virtualScroller.scrollTop).to.equal(250);
    });

    it('should set tabindex=0 on the checkbox when the it receives focus', () => {
      render(<TestDataGridSelection checkboxSelection />);
      const checkbox = screen.getAllByRole('checkbox', { name: /select row checkbox/i })[0];
      const checkboxCell = getCell(0, 0);
      const secondCell = getCell(0, 1);
      expect(checkbox).to.have.attribute('tabindex', '-1');
      expect(checkboxCell).to.have.attribute('tabindex', '-1');
      expect(secondCell).to.have.attribute('tabindex', '-1');

      secondCell.focus();
      fireEvent.mouseUp(secondCell);
      fireEvent.click(secondCell);
      expect(secondCell).to.have.attribute('tabindex', '0');

      fireEvent.keyDown(secondCell, { key: 'ArrowLeft' });
      expect(secondCell).to.have.attribute('tabindex', '-1');
      // Ensure that checkbox has tabindex=0 and the cell has tabindex=-1
      expect(checkbox).to.have.attribute('tabindex', '0');
      expect(checkboxCell).to.have.attribute('tabindex', '-1');
    });

    it('should select/unselect all rows when pressing space', async () => {
      render(<TestDataGridSelection checkboxSelection />);

      const selectAllCell = document.querySelector(
        '[role="columnheader"][data-field="__check__"] input',
      ) as HTMLElement;
      selectAllCell.focus();

      fireEvent.keyDown(selectAllCell, {
        key: ' ',
      });

      expect(getSelectedRowIds()).to.deep.equal([0, 1, 2, 3]);
      fireEvent.keyDown(selectAllCell, {
        key: ' ',
      });

      expect(getSelectedRowIds()).to.deep.equal([]);
    });
  });

  describe('props: isRowSelectable', () => {
    it('should update the selected rows when the isRowSelectable prop changes', async () => {
      const { setProps } = render(
        <TestDataGridSelection isRowSelectable={() => true} checkboxSelection />,
      );

      fireEvent.click(getRow(0));
      fireEvent.click(getRow(1));

      expect(getSelectedRowIds()).to.deep.equal([0, 1]);

      setProps({ isRowSelectable: (params) => Number(params.id) % 2 === 0 });
      expect(getSelectedRowIds()).to.deep.equal([0]);
    });

    it('should not select unselectable rows given in selectionModel', () => {
      const { setProps } = render(
        <TestDataGridSelection
          selectionModel={[0, 1]}
          isRowSelectable={(params) => Number(params.id) % 2 === 0}
          checkboxSelection
        />,
      );

      expect(getSelectedRowIds()).to.deep.equal([0]);
      setProps({ selectionModel: [0, 1, 2, 3] });
      expect(getSelectedRowIds()).to.deep.equal([0, 2]);
    });

    it('should filter out unselectable rows when the selectionModel prop changes', () => {
      const { setProps } = render(
        <TestDataGridSelection
          selectionModel={[1]}
          isRowSelectable={(params) => params.id > 0}
          checkboxSelection
        />,
      );
      expect(getSelectedRowIds()).to.deep.equal([1]);
      expect(getColumnHeaderCell(0).querySelector('input')).to.have.attr(
        'data-indeterminate',
        'true',
      );

      setProps({ selectionModel: [0] });
      expect(getColumnHeaderCell(0).querySelector('input')).to.have.attr(
        'data-indeterminate',
        'false',
      );
      expect(getSelectedRowIds()).to.deep.equal([]);
    });
  });

  describe('props: rows', () => {
    it('should remove the outdated selected rows when rows prop changes', () => {
      const data = getData(4, 2);

      const { setProps } = render(
        <TestDataGridSelection selectionModel={[0, 1, 2]} checkboxSelection {...data} />,
      );
      expect(getSelectedRowIds()).to.deep.equal([0, 1, 2]);

      setProps({
        rows: data.rows.slice(0, 1),
      });
      expect(getSelectedRowIds()).to.deep.equal([0]);
    });
  });

  describe('props: selectionModel and onSelectionModelChange', () => {
    it('should select rows when initialised (array-version)', () => {
      render(<TestDataGridSelection selectionModel={[1]} />);
      expect(getSelectedRowIds()).to.deep.equal([1]);
    });

    it('should select rows when initialised (non-array version)', () => {
      render(<TestDataGridSelection selectionModel={1} />);
      expect(getSelectedRowIds()).to.deep.equal([1]);
    });

    it('should allow to switch selectionModel from array version to non-array version', () => {
      const { setProps } = render(<TestDataGridSelection selectionModel={[1]} />);
      expect(getSelectedRowIds()).to.deep.equal([1]);

      setProps({ selectionModel: 1 });
      expect(getSelectedRowIds()).to.deep.equal([1]);
    });

    it('should not call onSelectionModelChange on initialisation or on selectionModel prop change', () => {
      const onSelectionModelChange = spy();

      const { setProps } = render(
        <TestDataGridSelection
          onSelectionModelChange={onSelectionModelChange}
          selectionModel={0}
        />,
      );
      expect(onSelectionModelChange.callCount).to.equal(0);
      setProps({ selectionModel: 1 });
      expect(onSelectionModelChange.callCount).to.equal(0);
    });

    it('should deselect the old selected rows when updating selectionModel', () => {
      const { setProps } = render(<TestDataGridSelection selectionModel={[0]} />);

      expect(getSelectedRowIds()).to.deep.equal([0]);

      setProps({ selectionModel: [1] });
      expect(getSelectedRowIds()).to.deep.equal([1]);
    });

    it('should update the selection when neither the model nor the onChange are set', () => {
      render(<TestDataGridSelection />);
      fireEvent.click(getCell(0, 0));
      expect(getSelectedRowIds()).to.deep.equal([0]);
    });

    it('should not update the selection model when the selectionModelProp is set', () => {
      const selectionModel: GridInputSelectionModel = [1];
      render(<TestDataGridSelection selectionModel={selectionModel} />);
      expect(getSelectedRowIds()).to.deep.equal([1]);

      fireEvent.click(getCell(0, 0));
      expect(getSelectedRowIds()).to.deep.equal([1]);
    });

    it('should update the selection when the model is not set, but the onChange is set', () => {
      const onModelChange = spy();
      render(<TestDataGridSelection onSelectionModelChange={onModelChange} />);

      fireEvent.click(getCell(0, 0));
      expect(getSelectedRowIds()).to.deep.equal([0]);
      expect(onModelChange.callCount).to.equal(1);
      expect(onModelChange.firstCall.firstArg).to.deep.equal([0]);
    });

    it('should control selection state when the model and the onChange are set', () => {
      const ControlCase = () => {
        const [selectionModel, setSelectionModel] = React.useState<any>([]);

        const handleSelectionChange = (newModel) => {
          if (newModel.length) {
            setSelectionModel([...newModel, 2]);
            return;
          }
          setSelectionModel(newModel);
        };

        return (
          <TestDataGridSelection
            selectionModel={selectionModel}
            onSelectionModelChange={handleSelectionChange}
            checkboxSelection
          />
        );
      };

      render(<ControlCase />);
      expect(getSelectedRowIds()).to.deep.equal([]);
      fireEvent.click(getCell(1, 0));
      expect(getSelectedRowIds()).to.deep.equal([1, 2]);
    });
  });

  describe('console error', () => {
    it('should throw console error when selectionModel contains more than 1 item in DataGrid without checkbox selection', () => {
      expect(() => {
        render(<TestDataGridSelection selectionModel={[0, 1]} />);
      })
        // @ts-expect-error need to migrate helpers to TypeScript
        .toErrorDev('selectionModel can only be of 1 item in DataGrid');
    });

    it('should not throw console error when selectionModel contains more than 1 item in DataGrid with checkbox selection', () => {
      expect(() => {
        render(<TestDataGridSelection selectionModel={[0, 1]} checkboxSelection />);
      })
        .not // @ts-expect-error need to migrate helpers to TypeScript
        .toErrorDev();
    });
  });
});
