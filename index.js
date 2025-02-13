/* ───────── 공통 함수 ───────── */
function getDecks() {
    const decks = localStorage.getItem('decks');
    return decks ? JSON.parse(decks) : [];
  }
  function saveDecks(decks) {
    localStorage.setItem('decks', JSON.stringify(decks));
  }
  function getTtsSetting() {
    return localStorage.getItem('ttsEnabled') === 'true';
  }
  function saveTtsSetting(enabled) {
    localStorage.setItem('ttsEnabled', enabled);
  }
  function showView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
  }
  function detectLanguage(text) {
    return /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(text) ? 'ko-KR' : 'en-US';
  }
  
  /* ───────── 학습 관련 변수 및 로직 ───────── */
  let currentDeck = null;
  let roundCards = [];
  let nextRoundCards = [];
  let sessionTotal = 0;
  let knownCount = 0;
  let forgotCount = 0;
  
  /* ───────── TTS 함수 ───────── */
  function playTTSFront() {
    if (!getTtsSetting() || !('speechSynthesis' in window)) return;
    if (roundCards.length === 0) return;
    const card = roundCards[0];
    if (card.word && card.word.trim() !== "") {
      const utterance = new SpeechSynthesisUtterance(card.word);
      utterance.lang = 'en-US';
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  }
  function playTTSBack() {
    if (!getTtsSetting() || !('speechSynthesis' in window)) return;
    if (roundCards.length === 0) return;
    const card = roundCards[0];
    if (card.meaning && card.meaning.trim() !== "") {
      const utterance = new SpeechSynthesisUtterance(card.meaning);
      utterance.lang = 'ko-KR';
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  }
  
  /* ───────── 카드 전환 애니메이션 ───────── */
  function animateCardTransition(callback) {
    const flashcard = document.getElementById('flashcard');
    flashcard.classList.remove('is-flipped');
    flashcard.classList.add('rotate-out');
    flashcard.addEventListener('transitionend', function handler(e) {
      if (e.propertyName !== 'transform') return;
      flashcard.removeEventListener('transitionend', handler);
      callback();
      flashcard.classList.remove('rotate-out');
      flashcard.classList.add('rotate-in');
      void flashcard.offsetWidth;
      flashcard.classList.remove('rotate-in');
    });
  }
  
  /* ───────── UI 업데이트 ───────── */
  function updateStudyCounts() {
    const currentIndex = sessionTotal - roundCards.length + 1;
    document.getElementById('progressInfo').textContent = currentIndex + " / " + sessionTotal;
    const progressPercent = (currentIndex / sessionTotal) * 100;
    document.querySelector('.progress').style.width = progressPercent + "%";
    document.getElementById('knownCount').textContent = knownCount;
    document.getElementById('remainingCount').textContent = forgotCount;
  }
  
  /* ───────── 카드 표시 및 라운드 종료 처리 ───────── */
  function showNextCard() {
    if (roundCards.length === 0) {
      showResultUI();
      return;
    }
    const card = roundCards[0];
    document.getElementById('cardFront').textContent = card.word;
    document.getElementById('cardBack').textContent = card.meaning;
    document.getElementById('flashcard').classList.remove('is-flipped');
    playTTSFront();
    updateStudyCounts();
  }
  
  /* ───────── 결과 UI (라운드 종료 시) ───────── */
  function showResultUI() {
    const studyResult = document.getElementById('studyResult');
    const resultMessage = document.getElementById('resultMessage');
    const resultPercentage = document.getElementById('resultPercentage');
    const resultButtons = document.getElementById('resultButtons');
    resultButtons.innerHTML = '';
    
    if (nextRoundCards.length > 0) {
      resultMessage.textContent = "잘하고 있어요!";
      const percent = Math.round((knownCount / sessionTotal) * 100);
      resultPercentage.textContent = "전체 카드의 " + percent + "%를 외웠습니다.";
      const continueBtn = document.createElement('button');
      continueBtn.className = 'btn-primary control-btn';
      continueBtn.textContent = "이어서 하기";
      continueBtn.addEventListener('click', function() {
        roundCards = nextRoundCards.slice();
        nextRoundCards = [];
        sessionTotal = roundCards.length;
        knownCount = 0;
        forgotCount = 0;
        updateStudyCounts();
        studyResult.style.display = 'none';
        document.querySelector('.flashcard').style.display = 'flex';
        document.querySelector('.study-controls').style.display = 'flex';
        showNextCard();
      });
      resultButtons.appendChild(continueBtn);
    } else {
      resultMessage.textContent = "수고하셨습니다! 모든 카드의 학습을 완료하였습니다.";
      resultPercentage.textContent = "";
      const resetBtn = document.createElement('button');
      resetBtn.className = 'btn-primary control-btn';
      resetBtn.textContent = "모든 카드 다시 학습하기";
      resetBtn.addEventListener('click', function() {
        roundCards = currentDeck.cards.slice();
        nextRoundCards = [];
        knownCount = 0;
        forgotCount = 0;
        sessionTotal = roundCards.length;
        updateStudyCounts();
        studyResult.style.display = 'none';
        document.querySelector('.flashcard').style.display = 'flex';
        document.querySelector('.study-controls').style.display = 'flex';
        showNextCard();
      });
      const menuBtn = document.createElement('button');
      menuBtn.className = 'btn-primary control-btn';
      menuBtn.textContent = "메인 메뉴로 돌아가기";
      menuBtn.addEventListener('click', function() {
        showView('menu');
      });
      resultButtons.appendChild(resetBtn);
      resultButtons.appendChild(menuBtn);
    }
    document.querySelector('.flashcard').style.display = 'none';
    document.querySelector('.study-controls').style.display = 'none';
    studyResult.style.display = 'block';
  }
  
  /* ───────── 학습 화면 버튼 이벤트 ───────── */
  document.getElementById('btnKnown').addEventListener('click', function() {
    if (roundCards.length === 0) return;
    animateCardTransition(function() {
      roundCards.shift();
      knownCount++;
      updateStudyCounts();
      if (roundCards.length === 0) {
        showResultUI();
      } else {
        showNextCard();
      }
    });
  });
  document.getElementById('btnForgot').addEventListener('click', function() {
    if (roundCards.length === 0) return;
    animateCardTransition(function() {
      let card = roundCards.shift();
      nextRoundCards.push(card);
      forgotCount++;
      updateStudyCounts();
      if (roundCards.length === 0) {
        showResultUI();
      } else {
        showNextCard();
      }
    });
  });
  document.getElementById('flashcard').addEventListener('click', function() {
    this.classList.toggle('is-flipped');
    if (this.classList.contains('is-flipped')) {
      playTTSBack();
    } else {
      playTTSFront();
    }
  });
  document.getElementById('mainMenuBtn').addEventListener('click', function() {
    showView('menu');
  });
  document.getElementById('studyBtn').addEventListener('click', function() {
    loadDeckListForStudy();
    showView('deckList');
  });
  document.getElementById('libraryBtn').addEventListener('click', function() {
    loadLibrary();
    showView('libraryView');
  });
  document.getElementById('settingsBtn').addEventListener('click', function() {
    document.getElementById('ttsToggle').checked = getTtsSetting();
    showView('settingsView');
  });
  document.getElementById('backFromDeckList').addEventListener('click', function() {
    showView('menu');
  });
  document.getElementById('backFromLibrary').addEventListener('click', function() {
    showView('menu');
  });
  document.getElementById('backFromSettings').addEventListener('click', function() {
    showView('menu');
  });
  document.getElementById('endStudyBtn').addEventListener('click', function() {
    roundCards = [];
    nextRoundCards = [];
    showResultUI();
  });
  
  /* ───────── 학습용 덱 목록 ───────── */
  function loadDeckListForStudy() {
    const decks = getDecks();
    const deckItemsDiv = document.getElementById('deckItems');
    deckItemsDiv.innerHTML = '';
    if (decks.length === 0) {
      deckItemsDiv.innerHTML = '<p>등록된 플래시카드가 없습니다. 라이브러리에서 추가해주세요.</p>';
    } else {
      decks.forEach(deck => {
        const div = document.createElement('div');
        div.className = 'list-item';
        div.textContent = deck.title;
        div.addEventListener('click', function() {
          startStudy(deck);
        });
        deckItemsDiv.appendChild(div);
      });
    }
  }
  function startStudy(deck) {
    currentDeck = deck;
    roundCards = deck.cards.slice();
    nextRoundCards = [];
    sessionTotal = roundCards.length;
    knownCount = 0;
    forgotCount = 0;
    updateStudyCounts();
    document.getElementById('studyResult').style.display = 'none';
    document.querySelector('.flashcard').style.display = 'flex';
    document.querySelector('.study-controls').style.display = 'flex';
    showNextCard();
    showView('studyView');
  }
  
  /* ───────── 라이브러리 화면 (카드 형태) ───────── */
  function loadLibrary() {
    const decks = getDecks();
    const libraryList = document.getElementById('libraryList');
    libraryList.innerHTML = '';
    if (decks.length === 0) {
      libraryList.innerHTML = '<p>등록된 플래시카드가 없습니다.</p>';
    } else {
      decks.forEach(deck => {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'library-card';
        
        const titleDiv = document.createElement('div');
        titleDiv.className = 'card-title';
        titleDiv.textContent = deck.title;
        
        const countDiv = document.createElement('div');
        countDiv.className = 'card-count';
        countDiv.textContent = deck.cards.length + '개';
        
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'card-actions';
        
        const editBtn = document.createElement('button');
        editBtn.title = "편집";
        editBtn.textContent = '✏️';
        editBtn.addEventListener('click', function() {
          loadDeckEdit(deck);
          showView('deckEditView');
        });
        
        const deleteBtn = document.createElement('button');
        deleteBtn.title = "삭제";
        deleteBtn.textContent = '🗑️';
        deleteBtn.addEventListener('click', function() {
          currentEditingDeck = deck;
          document.getElementById('deleteConfirmModal').style.display = 'flex';
        });
        
        actionsDiv.appendChild(editBtn);
        actionsDiv.appendChild(deleteBtn);
        
        cardDiv.appendChild(titleDiv);
        cardDiv.appendChild(countDiv);
        cardDiv.appendChild(actionsDiv);
        
        libraryList.appendChild(cardDiv);
      });
    }
  }
  document.getElementById('libraryAddDeckBtn').addEventListener('click', function() {
    loadDeckEdit(null);
    showView('deckEditView');
  });
  
  /* ───────── 덱 편집 화면 (개선된 레이아웃) ───────── */
  let currentEditingDeck = null;
  function loadDeckEdit(deck) {
    currentEditingDeck = deck || null;
    const deckTitleInput = document.getElementById('deckTitleInput');
    const deckEditHeaderTitle = document.getElementById('deckEditHeaderTitle');
    const deleteDeckBtn = document.getElementById('deleteDeckBtn');
    if (deck) {
      deckEditHeaderTitle.textContent = '카드 편집';
      deleteDeckBtn.style.display = 'inline-block';
      deckTitleInput.value = deck.title;
    } else {
      deckEditHeaderTitle.textContent = '새 카드 추가';
      deleteDeckBtn.style.display = 'none';
      deckTitleInput.value = '';
    }
    const deckEditList = document.getElementById('deckEditList');
    deckEditList.innerHTML = '';
    let cards;
    if (deck && deck.cards && deck.cards.length > 0) {
      cards = deck.cards;
    } else {
      cards = [
        {word: 'come', meaning: '온다'},
        {word: '', meaning: ''},
        {word: '', meaning: ''},
        {word: '', meaning: ''},
        {word: '', meaning: ''}
      ];
    }
    cards.forEach((card, index) => {
      addDeckEditRow(card, index);
    });
  }
  function addDeckEditRow(cardData, index) {
    const deckEditList = document.getElementById('deckEditList');
    const rowDiv = document.createElement('div');
    rowDiv.className = 'card-edit-row';
    
    const indexDiv = document.createElement('div');
    indexDiv.className = 'card-edit-index';
    indexDiv.textContent = String(index + 1).padStart(3, '0');
    
    const inputsDiv = document.createElement('div');
    inputsDiv.className = 'card-edit-inputs';
    
    const wordInput = document.createElement('input');
    wordInput.type = 'text';
    wordInput.className = 'card-word';
    wordInput.placeholder = '단어';
    wordInput.value = cardData.word;
    
    const meaningInput = document.createElement('input');
    meaningInput.type = 'text';
    meaningInput.className = 'card-meaning';
    meaningInput.placeholder = '의미';
    meaningInput.value = cardData.meaning;
    
    inputsDiv.appendChild(wordInput);
    inputsDiv.appendChild(meaningInput);
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-delete-card';
    deleteBtn.title = "삭제";
    deleteBtn.textContent = '🗑️';
    deleteBtn.addEventListener('click', function() {
      if (deckEditList.children.length > 1) {
        rowDiv.remove();
        updateCardRowNumbers();
      }
    });
    
    rowDiv.appendChild(indexDiv);
    rowDiv.appendChild(inputsDiv);
    rowDiv.appendChild(deleteBtn);
    
    deckEditList.appendChild(rowDiv);
  }
  function updateCardRowNumbers() {
    const rows = document.querySelectorAll('#deckEditList .card-edit-row');
    rows.forEach((row, index) => {
      const indexDiv = row.querySelector('.card-edit-index');
      if (indexDiv) {
        indexDiv.textContent = String(index + 1).padStart(3, '0');
      }
    });
  }
  function addNewDeckEditRow() {
    const deckEditList = document.getElementById('deckEditList');
    const index = deckEditList.children.length;
    addDeckEditRow({word: '', meaning: ''}, index);
  }
  document.getElementById('addCardRowBtn').addEventListener('click', function() {
    addNewDeckEditRow();
  });
  document.getElementById('cancelDeckEditBtn').addEventListener('click', function() {
    showView('libraryView');
  });
  document.getElementById('saveDeckBtn').addEventListener('click', function() {
    const title = document.getElementById('deckTitleInput').value.trim();
    if (!title) { alert('덱 제목을 입력하세요.'); return; }
    const rows = document.querySelectorAll('#deckEditList .card-edit-row');
    let cards = [];
    rows.forEach(row => {
      const word = row.querySelector('.card-word').value.trim();
      const meaning = row.querySelector('.card-meaning').value.trim();
      if (word || meaning) {
        cards.push({word, meaning});
      }
    });
    if (cards.length === 0) { alert('적어도 하나의 카드를 입력하세요.'); return; }
    let decks = getDecks();
    if (currentEditingDeck) {
      decks = decks.map(d => d.id === currentEditingDeck.id ? {id: d.id, title: title, cards: cards} : d);
    } else {
      const newDeck = {id: Date.now(), title: title, cards: cards};
      decks.push(newDeck);
    }
    saveDecks(decks);
    alert('저장되었습니다.');
    loadLibrary();
    showView('libraryView');
  });
  document.getElementById('deleteDeckBtn').addEventListener('click', function() {
    document.getElementById('deleteConfirmModal').style.display = 'flex';
  });
  document.getElementById('confirmDeleteBtn').addEventListener('click', function() {
    if (currentEditingDeck) {
      let decks = getDecks();
      decks = decks.filter(d => d.id !== currentEditingDeck.id);
      saveDecks(decks);
      alert('삭제되었습니다.');
      document.getElementById('deleteConfirmModal').style.display = 'none';
      loadLibrary();
      showView('libraryView');
    }
  });
  document.getElementById('cancelDeleteBtn').addEventListener('click', function() {
    document.getElementById('deleteConfirmModal').style.display = 'none';
  });
  /* ───────── 설정 화면: 모든 플래시 카드 삭제하기 ───────── */
  document.getElementById('deleteAllCardsBtn').addEventListener('click', function() {
    document.getElementById('deleteAllModal').style.display = 'flex';
  });
  document.getElementById('confirmDeleteAllBtn').addEventListener('click', function() {
    saveDecks([]);
    alert('모든 플래시 카드가 삭제되었습니다.');
    document.getElementById('deleteAllModal').style.display = 'none';
    loadLibrary();
  });
  document.getElementById('cancelDeleteAllBtn').addEventListener('click', function() {
    document.getElementById('deleteAllModal').style.display = 'none';
  });
  document.getElementById('ttsToggle').addEventListener('change', function() {
    saveTtsSetting(this.checked);
  });
  