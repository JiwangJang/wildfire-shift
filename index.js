(() => {
  const toggleBtn = getElement("id", "toggle-btn");
  const registerForm = getElement("id", "register-form");
  const calenderHeader = getElement("id", "calender-header");
  const calenderTitle = getElement("id", "calender-title");
  const workerListElem = getElement("id", "worker-list");
  const tbody = document.querySelector("#calender-body tbody");
  const workOrders = [...document.querySelectorAll(".work-orders")];
  /**workerList에서 쉽게 로직을 적용하기위한 꼼수 */
  const listKey = ["weekday", "saturday", "sunday"];

  /**
   * HTML요소를 가져와주는 함수
   * @param {string} type 아이디인지 클래스인지
   * @param {string} text 아이디(클래스)명 입력
   */
  function getElement(type, text) {
    switch (type) {
      case "id":
        return document.querySelector(`#${text}`);
      case "class":
        return document.querySelector(`.${text}`);
      case "tag":
        return document.querySelector(`${text}`);
    }
  }

  /**
   * 로컬스토리지에 데이터 저장하는 함수
   * @param {string} key 로컬스토리지 키
   * @param {string} data 로컬스토리지 값
   */
  function setData(key, data) {
    const stringified = JSON.stringify(data);
    localStorage.setItem(key, stringified);
  }

  /**
   * 로컬스토리지에서 데이터 불러오는 함수
   * @param {string} key 로컬스토리지 키
   */
  function getData(key) {
    return JSON.parse(localStorage.getItem(key));
  }

  /**
   * 현재 달을 기준으로 전달 자료가 있는지 확인해주는 함수
   */
  function isAlreadyExist() {
    const currentYear = getData("currentYear") ?? new Date().getFullYear();
    const currentMonth = getData("currentMonth") ?? new Date().getMonth();
    const [prevYear, prevMonth] = getNextOrPrevMonth(
      currentYear,
      currentMonth,
      false
    );
    const prevData = getData(`${prevYear}-${prevMonth}`);
    if (prevData) return true;
    else return false;
  }

  /**
   * 근무자등록시 호출하는 함수
   */
  function registerFormEvent() {
    const input = getElement("id", "register-input");
    const workerName = input.value;
    const workerList = getData("newWorkerList");
    const {
      weekday: weekdayList,
      sunday: sundayList,
      saturday: saturdayList,
    } = workerList;
    const workerNameList = weekdayList.map(({ name }) => name);

    input.value = "";

    const noSpacedWorkername = workerName.replace(/\s/g, "");
    if (noSpacedWorkername === "")
      return alert("근무자의 이름을 제대로 입력해주세요");
    if (!workerNameList.indexOf(noSpacedWorkername))
      return alert("동명이인이 있습니다.");

    weekdayList.push({
      name: workerName,
      isNext: weekdayList.length === 0 ? true : false,
    });
    sundayList.push({
      name: workerName,
      isNext: sundayList.length === 0 ? true : false,
    });
    saturdayList.push({
      name: workerName,
      isNext: saturdayList.length === 0 ? true : false,
    });

    setData("newWorkerList", workerList);
    workerListRender();
    calenderDataMaker();
  }

  /**
   * 근무자 목록 갱신해주는 함수
   */
  function workerListRender() {
    const workerList = getData("newWorkerList");
    if (!workerList) {
      setData("newWorkerList", {
        weekday: [],
        sunday: [],
        saturday: [],
      });
      return;
    }

    workerListElem.innerHTML = "";
    workerList.weekday.forEach((worker) => {
      workerListElem.innerHTML += `
      <div class="list-child">
        <span class="list-name">${worker.name}</span>
        <div class="btns flex-center-align">
          <button class="revise-btn"></button>
          <button class="delete-btn"></button>
        </div>
    </div>
      `;
    });
  }

  /**
   * 근무자를 골라주는 함수
   * @param {{name : string;
   *          weekday:boolean;
   *          sunday:boolean;
   *             saturday:boolean;}[]} workerArr
   * @param {string} type
   * @returns {string}
   */
  function workerSelector(workerArr) {
    if (workerArr.length === 0) {
      return "";
    }

    const worker = workerArr.filter((worker) => worker.isNext === true)[0];
    const workerIndex = workerArr.indexOf(worker);
    workerArr[workerIndex].isNext = false;
    workerArr.length === workerIndex + 1
      ? (workerArr[0].isNext = true)
      : (workerArr[workerIndex + 1].isNext = true);

    return worker.name;
  }

  /**
   * 달력데이터를 만드는 함수
   * @param {boolean} [isNew=false] 데이터를 새로 만들건지 현재 있는것을 수정할건지
   */
  function calenderDataMaker(isNew = false) {
    const currentYear = getData("currentYear");
    const nextMonth = getData("currentMonth");
    const key = currentYear + "-" + nextMonth;
    const newData = [];
    const workerList = getData("newWorkerList");
    let list;

    if (isNew) {
      const lastDate = new Date(currentYear, nextMonth + 1, 0).getDate();
      for (let i = 0; i < lastDate; i++) {
        const day = new Date(currentYear, nextMonth, i + 1).getDay();
        let worker;
        switch (day) {
          case 0:
            list = workerList.sunday;
            break;
          case 6:
            list = workerList.saturday;
            break;
          default:
            list = workerList.weekday;
            break;
        }
        worker = workerSelector(list);

        const dayData = {
          date: i + 1,
          day,
          worker,
          isDirected: false,
        };
        newData.push(dayData);
      }
    } else {
      const data = getData(key);
      data.forEach((obj) => {
        switch (obj.day) {
          case 0:
            list = workerList.sunday;
            break;
          case 6:
            list = workerList.saturday;
            break;
          default:
            list = workerList.weekday;
            break;
        }

        obj.worker = workerSelector(list);
      });
      newData.push(...data);
    }

    setData(key, newData);
    calenderRender();
  }

  /**
   * 달력을 렌더링하는 함수
   */
  function calenderRender() {
    const currentYear = getData("currentYear");
    const currentMonth = getData("currentMonth");
    const calenderData = getData(`${currentYear}-${currentMonth}`);

    if (!calenderData) {
      calenderDataMaker(true);
      return;
    }

    const lastDate = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const calenderRowCount = Math.ceil((lastDate + firstDay) / 7);
    const calenderResult = [];
    let calenderPos = 0;
    let calenderDataIndex = 0;
    for (let row = 0; row < calenderRowCount; row++) {
      const tableRow = [];
      for (let col = 0; col < 7; col++) {
        if (calenderPos < firstDay || calenderDataIndex > lastDate - 1) {
          tableRow.push("<td></td>");
        } else {
          let dayClass;
          const { date, worker, day, isDirected } =
            calenderData[calenderDataIndex];
          switch (day) {
            case 0:
              if (isDirected) {
                dayClass = "direct-sunday";
                break;
              }
              dayClass = "sunday";
              break;
            case 6:
              dayClass = "saturday";
              break;
            default:
              dayClass = "";
              break;
          }

          tableRow.push(`
          <td>
            <div class="date ${dayClass}">${date}</div>
            <div class="calender-name flex-center-align">${
              worker ?? "&nbsp;"
            }</div>
          </td>`);
          calenderDataIndex++;
        }
        calenderPos++;
      }
      const week = tableRow.join("");
      calenderResult.push(`
        <tr>
          ${week}
        </tr>
      `);
    }

    tbody.innerHTML = calenderResult.join("");
  }

  /**
   * 초기 셋팅
   */
  function settting() {
    const currentYear = getData("currentYear") ?? new Date().getFullYear();
    const currentMonth = getData("currentMonth") ?? new Date().getMonth();

    setData("currentYear", currentYear);
    setData("currentMonth", currentMonth);

    calenderTitle.innerText = `${currentYear}년 ${currentMonth + 1}월`;
    if (!isAlreadyExist()) {
      calenderTitle.parentElement.firstElementChild.classList.add("hidden");
    }

    // 근무순서설정 드래그 기능 구현
    workOrders.forEach((elem) => {
      elem.addEventListener("dragover", (e) => {
        e.preventDefault();
        const dragTarget = document.querySelector(".dragging");
        const siblings = [
          ...elem.querySelectorAll(".work-order:not(.dragging)"),
        ];
        const nextElem = siblings.find((sibling) => {
          const { top, height } = sibling.getBoundingClientRect();
          return e.clientY <= top + height / 2;
        });

        elem.insertBefore(dragTarget, nextElem);
      });
    });
    workerListRender();
    calenderRender();
  }

  /**
   * 다음달이나 이전달 구해주는 함수
   * @param {number} year
   * @param {number} month
   * @param {boolean} [isNext=true] true면 다음달거, false면 전달거
   */
  function getNextOrPrevMonth(year, month, isNext = true) {
    let resultYear = year;
    let resultMonth = month;

    if (isNext) {
      if (resultMonth + 1 === 12) {
        resultMonth = 0;
        resultYear++;
      } else {
        resultMonth++;
      }
    } else {
      if (resultMonth - 1 === -1) {
        resultMonth = 11;
        resultYear--;
      } else {
        resultMonth--;
      }
    }

    return [resultYear, resultMonth];
  }

  toggleBtn.addEventListener("click", (e) => {
    const workerList = getData("newWorkerList");
    const workOrders = Array.from(document.querySelectorAll(".work-orders"));
    const body = document.body;
    body.classList.toggle("calender-mode");

    if (!body.classList.contains("calender-mode")) {
      // 근무순서 설정 화면

      const orderArr = listKey.reduce(
        (prev, key) => {
          const currentList = workerList[key];
          currentList.forEach(({ name }) => {
            prev[key].push(`<p class="work-order" draggable=true>${name}</p>`);
          });
          return prev;
        },
        {
          weekday: [],
          saturday: [],
          sunday: [],
        }
      );
      listKey.forEach((key, i) => {
        workOrders[i].innerHTML = orderArr[key].join("");
      });

      [...document.querySelectorAll(".work-order")].forEach((elem) => {
        elem.addEventListener("dragstart", () =>
          elem.classList.add("dragging")
        );
        elem.addEventListener("dragend", () =>
          elem.classList.remove("dragging")
        );
      });
    } else {
      // 설정한 근무순서를 바탕으로 달력제작
      const directedList = workOrders.map((workorder) => {
        return [...workorder.children].map((elem) => elem.innerText);
      });

      // const {weekday: originWeekday, saturday: originSaturday, sunday: originSunday} = workerList;

      listKey.forEach((key, i) => {
        workerList[key].sort((a, b) => {
          const second = directedList[i].indexOf(a.name);
          const first = directedList[i].indexOf(b.name);
          if (first - second < 0) return 1;
          if (first - second === 0) return 0;
          if (first - second > 0) return -1;
        });

        workerList[key].forEach((obj, i) => {
          obj.isNext = i === 0 ? true : false;
        });
      });

      setData("newWorkerList", workerList);
      calenderDataMaker();
    }
  });

  registerForm.addEventListener("keydown", (e) => {
    if (e.target.id === "register-input" && e.key === "Enter") {
      registerFormEvent();
    }
  });

  registerForm.addEventListener("click", (e) => {
    if (e.target.id === "register-btn") {
      registerFormEvent();
    }
  });

  workerListElem.addEventListener("click", (e) => {
    const target = e.target;
    const workerName =
      target.parentElement.parentElement.firstElementChild.innerText;
    const listChild = target.parentElement.parentElement;
    const targetClassName = target.className;
    const workerList = getData("newWorkerList");

    switch (targetClassName) {
      case "revise-btn":
        listChild.innerHTML = `
        <input type="text" class="revise-input" value="${workerName}" autofocus/>
        <button class="revised-name-save" data-originname=${workerName}>저장</button>
        `;
        return;
      case "delete-btn":
        listKey.forEach((key) => {
          const currentList = workerList[key];
          const selected = currentList.filter(
            ({ name }) => name === workerName
          )[0];
          const selectedIndex = currentList.indexOf(selected);
          const nextIndex =
            selectedIndex + 1 === currentList.length ? 0 : selectedIndex + 1;
          currentList[nextIndex].isNext = true;
          currentList.splice(selectedIndex, 1);
        });

        break;
      case "revised-name-save":
        const revisedName = target.parentElement.firstElementChild.value;
        const originName = target.dataset.originname;
        listKey.forEach((key) => {
          const currentList = workerList[key];
          currentList.forEach((obj) => {
            if (obj.name === originName) {
              obj.name = revisedName;
            }
          });
        });
        break;
    }

    if (
      targetClassName === "delete-btn" ||
      targetClassName === "revised-name-save"
    ) {
      setData("newWorkerList", workerList);
      calenderDataMaker();
      workerListRender();
    }
  });

  workerListElem.addEventListener("keydown", (e) => {
    const target = e.target;
    const targetClassName = target.className;

    if (e.key === "Enter" && targetClassName === "revise-input") {
      const workerList = getData("newWorkerList");
      const revisedName = target.value;
      const originName =
        target.parentElement.lastElementChild.dataset.originname;
      listKey.forEach((key) => {
        const currentList = workerList[key];
        currentList.forEach((obj) => {
          if (obj.name === originName) {
            obj.name = revisedName;
          }
        });
      });
      setData("newWorkerList", workerList);
      calenderDataMaker();
      workerListRender();
    }
  });

  workerListElem.addEventListener("mouseover", (e) => {
    if (e.target.classList.contains("list-name")) {
      const calenderNameArr = Array.from(
        document.querySelectorAll(".calender-name")
      );
      calenderNameArr.forEach((nameElem) => {
        if (nameElem.innerText === e.target.innerText) {
          nameElem.classList.add("hover");
        }
      });
    }
  });

  workerListElem.addEventListener("mouseout", (e) => {
    if (e.target.classList.contains("list-name")) {
      const calenderNameArr = Array.from(
        document.querySelectorAll(".calender-name")
      );
      calenderNameArr.forEach((nameElem) => {
        if (nameElem.innerText === e.target.innerText) {
          nameElem.classList.remove("hover");
        }
      });
    }
  });

  calenderHeader.addEventListener("click", (e) => {
    const currentYear = getData("currentYear");
    const currentMonth = getData("currentMonth");
    switch (e.target.id) {
      case "prev-btn":
        const [prevYear, prevMonth] = getNextOrPrevMonth(
          currentYear,
          currentMonth,
          false
        );
        setData("currentYear", prevYear);
        setData("currentMonth", prevMonth);
        calenderRender();
        calenderTitle.innerText = `${prevYear}년 ${prevMonth + 1}월`;
        if (!isAlreadyExist())
          getElement("id", "prev-btn").classList.add("hidden");
        else getElement("id", "prev-btn").classList.remove("hidden");
        break;
      case "next-btn":
        const [nextYear, nextMonth] = getNextOrPrevMonth(
          currentYear,
          currentMonth
        );
        const curData = getData(`${currentYear}-${currentMonth}`);
        const nextData = getData(`${nextYear}-${nextMonth}`);
        setData("currentYear", nextYear);
        setData("currentMonth", nextMonth);

        const workerList = getData("newWorkerList");
        const lastWorkerObj = curData.reduce(
          (result, { day, worker }) => {
            switch (day) {
              case 0:
                if (result.lastSundayWorker !== worker) {
                  result.lastSundayWorker = worker;
                }
                break;
              case 6:
                if (result.lastSaturdayWorker !== worker) {
                  result.lastSaturdayWorker = worker;
                }
                break;
              default:
                if (result.lastWeekdayWorker !== worker) {
                  result.lastWeekdayWorker = worker;
                }
                break;
            }

            return result;
          },
          {
            lastWeekdayWorker: "",
            lastSaturdayWorker: "",
            lastSundayWorker: "",
          }
        );
        const { lastWeekdayWorker, lastSaturdayWorker, lastSundayWorker } =
          lastWorkerObj;
        listKey.forEach((key) => {
          const currentList = workerList[key];
          const lastWorker =
            key === "sunday"
              ? lastSundayWorker
              : key === "saturday"
              ? lastSaturdayWorker
              : lastWeekdayWorker;
          currentList.forEach((worker, i) => {
            const nextIndex = i + 1 === currentList.length ? 0 : i + 1;
            currentList[nextIndex].isNext =
              worker.name === lastWorker ? true : false;
          });
        });
        console.log(workerList);
        setData("newWorkerList", workerList);
        nextData ? calenderDataMaker() : calenderDataMaker(true);
        calenderTitle.innerText = `${nextYear}년 ${nextMonth + 1}월`;
        !isAlreadyExist()
          ? getElement("id", "prev-btn").classList.add("hidden")
          : getElement("id", "prev-btn").classList.remove("hidden");
        break;
      case "copy-btn":
        const year = getData("currentYear");
        const month = getData("currentMonth");
        const data = getData(`${year}-${month}`);

        const lastDate = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
        const calenderRowCount = Math.ceil((lastDate + firstDay) / 7);
        const calenderResult = [];
        let calenderPos = 0;
        let calenderDataIndex = 0;
        for (let row = 0; row < calenderRowCount; row++) {
          const dateRow = [];
          const workerRow = [];
          for (let col = 0; col < 7; col++) {
            if (calenderPos < firstDay || calenderDataIndex > lastDate - 1) {
              dateRow.push("\t");
              workerRow.push("\t");
            } else {
              const { date, worker } = data[calenderDataIndex];
              dateRow.push(`${date}\t`);
              workerRow.push(`${worker}\t`);
              calenderDataIndex++;
            }
            calenderPos++;
          }
          dateRow.push("\n");
          workerRow.push("\n");
          calenderResult.push(...dateRow);
          calenderResult.push(...workerRow);
        }

        navigator.clipboard
          .writeText(calenderResult.join(""))
          .then(() => {
            alert("근무표가 복사되었습니다.");
          })
          .catch(() => {
            alert("근무표복사에 실패했습니다. 다시시도해주세요.");
          });
        break;
    }
  });

  tbody.addEventListener("click", (e) => {
    const target = e.target;

    if (target.classList.contains("date")) {
      if (target.classList.contains("sunday")) return;

      const currentYear = getData("currentYear");
      const currentMonth = getData("currentMonth");
      const curData = getData(`${currentYear}-${currentMonth}`);
      const workerList = getData("newWorkerList");

      const directDate = target.innerText;
      if (isAlreadyExist()) {
        const [prevYear, prevMonth] = getNextOrPrevMonth(
          currentYear,
          currentMonth,
          false
        );
        const prevData = getData(`${prevYear}-${prevMonth}`);
        const lastWorkerObj = prevData.reduce(
          (result, { day, worker }) => {
            switch (day) {
              case 0:
                if (result.lastSundayWorker !== worker) {
                  result.lastSundayWorker = worker;
                }
              case 6:
                if (result.lastSaturdayWorker !== worker) {
                  result.lastSaturdayWorker = worker;
                }
              default:
                if (result.lastWeekdayWorker !== worker) {
                  result.lastWeekdayWorker = worker;
                }
            }

            return result;
          },
          {
            lastWeekdayWorker: "",
            lastSaturdayWorker: "",
            lastSundayWorker: "",
          }
        );

        const { lastWeekdayWorker, lastSaturdayWorker, lastSundayWorker } =
          lastWorkerObj;

        listKey.forEach((key) => {
          const currentList = workerList[key];
          const lastWorker =
            key === "sunday"
              ? lastSundayWorker
              : key === "saturday"
              ? lastSaturdayWorker
              : lastWeekdayWorker;
          currentList.forEach((worker, i) => {
            const nextIndex = i + 1 === currentList.length ? 0 : i + 1;
            currentList[nextIndex].isNext =
              worker.name === lastWorker ? true : false;
          });
        });
      } else {
        const firstSundayWorker = curData.find(({ day }) => day === 0).worker;
        const firstSaturdayWorker = curData.find(({ day }) => day === 6).worker;
        const firstWeekdayWorker = curData.find(
          ({ day }) => day !== 0 && day !== 6
        ).worker;

        listKey.forEach((key) => {
          const currentList = workerList[key];
          const lastWorker =
            key === "sunday"
              ? firstSundayWorker
              : key === "saturday"
              ? firstSaturdayWorker
              : firstWeekdayWorker;
          currentList.forEach((worker) => {
            worker.isNext = worker.name === lastWorker ? true : false;
          });
        });
      }

      curData.forEach((obj) => {
        if (obj.date == directDate) {
          if (!target.classList.contains("direct-sunday")) {
            obj.day = 0;
            obj.isDirected = true;
          } else {
            const primeDay = new Date(
              currentYear,
              currentMonth,
              obj.date
            ).getDay();
            obj.day = primeDay;
            obj.isDirected = false;
          }
        }
      });

      setData(`${currentYear}-${currentMonth}`, curData);
      setData("newWorkerList", workerList);
      calenderDataMaker();
    }
  });

  settting();
})();
