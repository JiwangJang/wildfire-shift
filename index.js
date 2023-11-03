(() => {
  const toggleBtn = getElement("id", "toggle-btn");
  const workOrder = getElement("id", "work-order");
  const registerForm = getElement("id", "register-form");
  const calenderHeader = getElement("id", "calender-header");
  const calenderTitle = getElement("id", "calender-title");
  const workerListElem = getElement("id", "worker-list");
  const tbody = document.querySelector("#calender-body tbody");

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
    if (key === "workerList") {
      workerListRender();
    }
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
    const workerList = getData("workerList");
    const workerNameList = workerList.map(({ name }) => name);

    input.value = "";

    const noSpacedWorkername = workerName.replace(/\s/g, "");
    if (noSpacedWorkername === "")
      return alert("근무자의 이름을 제대로 입력해주세요");
    if (!workerNameList.indexOf(noSpacedWorkername))
      return alert("동명이인이 있습니다.");

    workerList.push({
      name: workerName,
      weekday: workerList.length === 0 ? true : false,
      saturday: workerList.length === 0 ? true : false,
      sunday: workerList.length === 0 ? true : false,
    });

    setData("workerList", workerList);
    workerListRender();
    calenderDataMaker();
  }

  /**
   * 근무자 목록 갱신해주는 함수
   */
  function workerListRender() {
    const workerList = getData("workerList");
    if (!workerList) {
      setData("workerList", []);
      return;
    }

    workerListElem.innerHTML = "";
    workerList.forEach((worker) => {
      workerListElem.innerHTML += `
      <div class="list-child">
        <span class="list-name">${worker.name}</span>
        <div class="what-start">
        ${worker.weekday ? "<span>평일</span>" : ""}
        ${worker.saturday ? "<span class='saturday-start'>토요일</span>" : ""}
        ${worker.sunday ? "<span class='sunday-start'>일요일</span>" : ""}
        </div>
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
  function workerSelector(workerArr, type) {
    if (workerArr.length === 0) {
      return "";
    }

    const worker = workerArr.filter((worker) => worker[type] === true)[0];
    const workerIndex = workerArr.indexOf(worker);
    workerArr[workerIndex][type] = false;
    if (workerArr.length === workerIndex + 1) {
      workerArr[0][type] = true;
    } else {
      workerArr[workerIndex + 1][type] = true;
    }
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
    const workerList = getData("workerList") ?? [];
    let type;

    if (isNew) {
      const lastDate = new Date(currentYear, nextMonth + 1, 0).getDate();
      for (let i = 0; i < lastDate; i++) {
        const day = new Date(currentYear, nextMonth, i + 1).getDay();
        let worker;
        switch (day) {
          case 0:
            type = "sunday";
            break;
          case 6:
            type = "saturday";
            break;
          default:
            type = "weekday";
            break;
        }

        worker = workerSelector(workerList, type);

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
            type = "sunday";
            break;
          case 6:
            type = "saturday";
            break;
          default:
            type = "weekday";
            break;
        }

        obj.worker = workerSelector(workerList, type);
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

  /**
   * 달력넘길때 마다 근무자 목록 초기화
   */
  function resetWorkerList() {
    // 로직작성, prevbtn nextbtn에 넣어주기
    const currentYear = getData("currentYear");
    const currentMonth = getData("currentMonth");
    const data = getData(`${currentYear}-${currentMonth}`);
    const newWorkerList = [];

    const firstWorkerObj = data.reduce(
      (result, { day, worker }) => {
        const { weekdayWorkers, saturdayWorkers, sundayWorkers, workers } =
          result;

        if (result.workers.indexOf(worker) === -1) {
          result.workers.push(worker);
        }

        if (day === 0 && sundayWorkers.indexOf(worker) === -1) {
          result.sundayWorkers.push(worker);
        } else if (day === 6 && saturdayWorkers.indexOf(worker) === -1) {
          result.saturdayWorkers.push(worker);
        } else if (weekdayWorkers.indexOf(worker) === -1) {
          result.weekdayWorkers.push(worker);
        }

        return result;
      },
      {
        weekdayWorkers: [],
        saturdayWorkers: [],
        sundayWorkers: [],
        workers: [],
      }
    );

    const { weekdayWorkers, saturdayWorkers, sundayWorkers, workers } =
      firstWorkerObj;
    const firstWeekdayWorker = weekdayWorkers[0];
    const firstSaturdayWorker = saturdayWorkers[0];
    const firstSundayWorker = sundayWorkers[0];

    weekdayWorkers.forEach((worker) => {
      const result = {
        name: worker,
        weekday: worker === firstWeekdayWorker ? true : false,
        saturday: worker === firstSaturdayWorker ? true : false,
        sunday: worker === firstSundayWorker ? true : false,
      };

      newWorkerList.push(result);
    });
    setData("workerList", newWorkerList);
    workerListRender();
  }

  toggleBtn.addEventListener("click", (e) => {
    const workerList = getData("workerList");
    const body = document.body;
    body.classList.toggle("calender-mode");

    if (!body.classList.contains("calender-mode")) {
      const workOrders = Array.from(document.querySelectorAll(".work-orders"));
      const orderArr = workerList.map(
        ({ name, weekday, saturday, sunday }) =>
          `<p class="work-order 
        ${weekday ? "next-weekday-worker" : ""}
        ${saturday ? "next-saturday-worker" : ""}
        ${sunday ? "next-sunday-worker" : ""}
        ">${name}</p>`
      );
      workOrders.forEach((workOrder) => {
        workOrder.innerHTML = orderArr.join("");
      });
    } else {
      const { weekday, saturday, sunday } = workOrder.children;
      const nextWeekdayWorker = weekday.querySelector(
        ".next-weekday-worker"
      ).innerText;
      const nextSaturdayWorker = saturday.querySelector(
        ".next-saturday-worker"
      ).innerText;
      const nextSundayWorker = sunday.querySelector(
        ".next-sunday-worker"
      ).innerText;

      workerList.forEach((worker) => {
        worker.weekday = worker.name === nextWeekdayWorker ? true : false;
        worker.saturday = worker.name === nextSaturdayWorker ? true : false;
        worker.sunday = worker.name === nextSundayWorker ? true : false;
      });

      setData("workerList", workerList);
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
    const workerList = getData("workerList");

    switch (targetClassName) {
      case "revise-btn":
        listChild.innerHTML = `
        <input type="text" class="revise-input" value="${workerName}" autofocus/>
        <button class="revised-name-save" data-originname=${workerName}>저장</button>
        `;
        return;
      case "delete-btn":
        const selected = workerList.filter(
          ({ name }) => name === workerName
        )[0];
        const selectedIndex = workerList.indexOf(selected);
        const checkArr = ["weekday", "saturday", "sunday"];

        checkArr.forEach((type) => {
          if (selected[type]) {
            const nextIndex =
              selectedIndex + 1 === workerList.length ? 0 : selectedIndex + 1;
            workerList[nextIndex][type] = true;
          }
        });

        workerList.splice(selectedIndex, 1);
        break;
      case "revised-name-save":
        const revisedName = target.parentElement.firstElementChild.value;
        const originName = target.dataset.originname;
        workerList.forEach((obj) => {
          if (obj.name === originName) {
            obj.name = revisedName;
          }
        });
        break;
    }

    if (
      targetClassName === "delete-btn" ||
      targetClassName === "revised-name-save"
    ) {
      setData("workerList", workerList);
      calenderDataMaker();
      workerListRender();
    }
  });

  workerListElem.addEventListener("keydown", (e) => {
    const target = e.target;
    const targetClassName = target.className;

    if (e.key === "Enter" && targetClassName === "revise-input") {
      const workerList = getData("workerList");
      const revisedName = target.value;
      const originName =
        target.parentElement.lastElementChild.dataset.originname;
      workerList.forEach((obj) => {
        if (obj.name === originName) {
          obj.name = revisedName;
        }
      });
      setData("workerList", workerList);
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

        const workerList = getData("workerList");
        const lastWorkerObj = curData.reduce(
          (result, { day, worker }) => {
            if (day === 0) {
              result.sundayWorkers.push(worker);
            } else if (day === 6) {
              result.saturdayWorkers.push(worker);
            } else {
              result.weekdayWorkers.push(worker);
            }

            return result;
          },
          {
            weekdayWorkers: [],
            saturdayWorkers: [],
            sundayWorkers: [],
          }
        );
        const { weekdayWorkers, saturdayWorkers, sundayWorkers } =
          lastWorkerObj;
        const lastWeekdayWorker = weekdayWorkers[weekdayWorkers.length - 1];
        const lastSaturdayWorker = saturdayWorkers[saturdayWorkers.length - 1];
        const lastSundayWorker = sundayWorkers[sundayWorkers.length - 1];

        workerList.forEach((worker, i) => {
          const nextIndex = i + 1 === workerList.length ? 0 : i + 1;
          workerList[nextIndex].weekday =
            worker.name === lastWeekdayWorker ? true : false;
          workerList[nextIndex].saturday =
            worker.name === lastSaturdayWorker ? true : false;
          workerList[nextIndex].sunday =
            worker.name === lastSundayWorker ? true : false;
        });
        setData("workerList", workerList);
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

    if (e.target.id === "prev-btn" || e.target.id === "next-btn") {
      resetWorkerList();
    }
  });

  workOrder.addEventListener("click", (e) => {
    const target = e.target;
    if (target.classList.contains("work-order")) {
      const parentElement = target.parentElement;
      const grandParentElement = parentElement.parentElement;

      Array.from(parentElement.children).forEach((elem) => {
        elem.classList.remove("next-weekday-worker");
        elem.classList.remove("next-saturday-worker");
        elem.classList.remove("next-sunday-worker");
      });

      switch (grandParentElement.id) {
        case "weekday":
          target.classList.add("next-weekday-worker");
          break;
        case "saturday":
          target.classList.add("next-saturday-worker");
          break;
        case "sunday":
          target.classList.add("next-sunday-worker");
          break;
      }
    }
  });

  tbody.addEventListener("click", (e) => {
    const target = e.target;

    if (target.classList.contains("date")) {
      if (target.classList.contains("sunday")) return;

      const currentYear = getData("currentYear");
      const currentMonth = getData("currentMonth");
      const curData = getData(`${currentYear}-${currentMonth}`);
      const workerList = getData("workerList");

      const directDate = target.innerText;
      if (isAlreadyExist()) {
        const [prevYear, prevMonth] = getNextOrPrevMonth(
          currentYear,
          currentMonth,
          false
        );
        const prevData = getData(`${prevYear}-${prevMonth}`);
        const prevLastWorkerObj = prevData.reduce(
          (result, { day, worker }) => {
            if (day === 0) {
              result.sundayWorkers.push(worker);
            } else if (day === 6) {
              result.saturdayWorkers.push(worker);
            } else {
              result.weekdayWorkers.push(worker);
            }

            return result;
          },
          {
            weekdayWorkers: [],
            saturdayWorkers: [],
            sundayWorkers: [],
          }
        );

        const { weekdayWorkers, saturdayWorkers, sundayWorkers } =
          prevLastWorkerObj;
        const lastWeekdayWorker = weekdayWorkers[weekdayWorkers.length - 1];
        const lastSaturdayWorker = saturdayWorkers[saturdayWorkers.length - 1];
        const lastSundayWorker = sundayWorkers[sundayWorkers.length - 1];

        workerList.forEach((worker, i) => {
          const nextIndex = i + 1 === workerList.length ? 0 : i + 1;
          workerList[nextIndex].weekday =
            worker.name === lastWeekdayWorker ? true : false;
          workerList[nextIndex].saturday =
            worker.name === lastSaturdayWorker ? true : false;
          workerList[nextIndex].sunday =
            worker.name === lastSundayWorker ? true : false;
        });
      } else {
        const firstSundayWorker = curData.filter(({ day }) => day === 0)[0]
          .worker;
        const firstSaturdayWorker = curData.filter(({ day }) => day === 6)[0]
          .worker;
        const firstWeekdayWorker = curData.filter(
          ({ day }) => day !== 0 && day !== 6
        )[0].worker;

        workerList.forEach((worker) => {
          worker.weekday = worker.name === firstWeekdayWorker ? true : false;
          worker.saturday = worker.name === firstSaturdayWorker ? true : false;
          worker.sunday = worker.name === firstSundayWorker ? true : false;
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
      setData("workerList", workerList);
      calenderDataMaker();
    }
  });

  settting();
})();
