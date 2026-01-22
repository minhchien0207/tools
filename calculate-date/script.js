$(document).ready(function () {
  $('#sDate, #eDate').datetimepicker({
    format: 'DD/MM/YYYY',
  });

  $('input[name=optRadio]').change(function (e) {
    $('div.type').hide();
    $('div.type input[type=text]').val('');
    $('div.type.type-' + $(this).val()).show();
  });

  $('#btnAction').on('click', function (e) {
    if ($('#sDate').val() == '') {
      alert('Vui lòng nhập ngày bắt đầu!!!');
      return;
    }
    let sDate = moment($('#sDate').val(), 'DD/MM/YYYY');

    const lstDate = $('form').serializeArray();
    const lstChoose = [];
    const arrResult = {
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
      6: [],
      7: [],
    };
    let countDate = 0;
    let maxRow = 0;

    if (lstDate.length > 0) {
      $.each(lstDate, function (i, e) {
        if (e.name == 'date[]') {
          lstChoose.push(+e.value);
        }
      });
    }

    let lastDate = null;
    if ($('input[name=optRadio]:checked').val() == 1) {
      if ($('#eDate').val() == '') {
        alert('Vui lòng nhập ngày kết thúc!!!');
        return;
      }

      let eDate = moment($('#eDate').val(), 'DD/MM/YYYY');

      if (moment(eDate).isBefore(sDate)) {
        alert('Ngày kết thúc phải lớn hơn ngày bắt đầu!!!');
        return;
      }

      while (moment(sDate).isSameOrBefore(eDate)) {
        if (lstChoose.length > 0) {
          if (!lstChoose.includes(moment(sDate).isoWeekday())) {
            arrResult[moment(sDate).isoWeekday()] = [
              ...arrResult[moment(sDate).isoWeekday()],
              moment(sDate).format('DD/MM/YYYY'),
            ];
            countDate++;
          }
        } else {
          arrResult[moment(sDate).isoWeekday()] = [
            ...arrResult[moment(sDate).isoWeekday()],
            moment(sDate).format('DD/MM/YYYY'),
          ];
          countDate++;
        }
        lastDate = moment(sDate).format('DD/MM/YYYY');
        sDate = new Date(moment(sDate, 'YYYYMMDD', true).add('days', 1).format());
      }
    } else {
      if ($('#totalDate').val() == '') {
        alert('Vui lòng nhập tổng số ngày!!!');
        return;
      }

      if (lstChoose.length == 7) {
        return;
      }

      let tempTotal = 0;
      const typeCalc = $('input[name=optCalc]:checked').val();
      while (tempTotal < +$('#totalDate').val()) {
        const currentDate = moment(sDate);
        if (lstChoose.length > 0) {
          if (!lstChoose.includes(currentDate.isoWeekday())) {
            arrResult[currentDate.isoWeekday()] = [
              ...arrResult[currentDate.isoWeekday()],
              currentDate.format('DD/MM/YYYY'),
            ];
            countDate++;
            if (typeCalc == 1) {
              tempTotal++;
            }
          }
        } else {
          arrResult[currentDate.isoWeekday()] = [
            ...arrResult[currentDate.isoWeekday()],
            currentDate.format('DD/MM/YYYY'),
          ];
          countDate++;
          if (typeCalc == 1) {
            tempTotal++;
          }
        }
        lastDate = currentDate.format('DD/MM/YYYY');
        sDate = new Date(moment(sDate, 'YYYYMMDD', true).add('days', 1).format());
        if (typeCalc == 2) {
          tempTotal++;
        }
      }
    }

    let lastRowEachCol = '<tr>';
    $.each(arrResult, function (i, e) {
      const length = e.length;
      if (length > 0 && length > maxRow) {
        maxRow = length;
      }
      lastRowEachCol += `<td>${length}</td>`;
    });
    lastRowEachCol += '</tr>';
    if (maxRow > 0) {
      let html = '';
      for (let i = 0; i < maxRow; i++) {
        html += `<tr>`;
        $.each(arrResult, function (j, e) {
          html += `<td class="${
            arrResult?.[j]?.[i] === lastDate
              ? 'bg-success'
              : arrResult?.[j]?.[i] === $('#sDate').val()
                ? 'bg-warning'
                : ''
          }">${arrResult?.[j]?.[i] ?? ''}</td>`;
        });
        html += `</tr>`;
      }
      html += lastRowEachCol;
      html += `<tr><td colspan="7">Tổng số ngày: <code>${countDate}</code></td></tr>`;
      $('#tblResult tbody').html(html);
    }
  });
});
