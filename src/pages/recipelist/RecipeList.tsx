import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Pagination } from 'antd';
import RecipeCard from '../../components/recipecard/RecipeCard';
import { db } from '../../firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import { Recipe, RecipeCreateTime } from '../../type/type';
import PlusMenuBtn from '../../components/plusmenubutton/PlusMenuBtn';
import styles from './RecipeList.module.css';
import CustomButton, {
	ButtonType,
} from '../../components/custombutton/CustomButton';
import { useAuth } from '../../context/AuthContext';

const RecipeList = () => {
	const [recipes, setRecipes] = useState<Recipe[]>([]); // 레시피 배열
	const [currentPage, setCurrentPage] = useState(1);
	const [loading, setLoading] = useState(false);
	const pageSize = 9; // 페이지당 보여줄 레시피 개수
	const location = useLocation();
	// 정렬 드롭다운
	const [isDropdownOpen, setIsDropdownOpen] = useState(false); // 드롭다운 상태
	const [selectedSorting, setSelectedSorting] = useState<string>('최신글');

	// URL 파라미터에서 검색어와 옵션을 가져와 상태 초기화
	const [searchTerm, setSearchTerm] = useState<string>('');
	const [selectedOption, setSelectedOption] = useState<string>('레시피');

	// URL 파라미터 변경 시 상태 초기화
	useEffect(() => {
		const queryParams = new URLSearchParams(location.search);
		const searchParam = queryParams.get('search') || '';
		const optionParam = queryParams.get('option') || '레시피'; // 기본 옵션 설정

		setSearchTerm(searchParam);
		setSelectedOption(optionParam);
		fetchRecipes(currentPage); // URL 파라미터가 변경될 때마다 데이터를 가져옵니다.
	}, [location.search]); // URL 파라미터가 변경될 때마다 호출

	const [filteredCount, setFilteredCount] = useState<number>(0);

	// 데이터를 페이징하여 가져오는 함수
	const fetchRecipes = async (page: number) => {
		setLoading(true);
		try {
			const recipeCollectionRef = collection(db, 'recipes');

			// 전체 레시피를 가져옴
			const allRecipesSnapshot = await getDocs(recipeCollectionRef);
			const allRecipes: Recipe[] = allRecipesSnapshot.docs.map((doc) => ({
				id: doc.id,
				...doc.data(),
			})) as Recipe[];

			let filteredRecipes: Recipe[];

			// 검색어가 있을 경우 필터링
			if (searchTerm) {
				filteredRecipes = allRecipes.filter((recipe) => {
					if (selectedOption === '레시피') {
						return recipe.recipe_name
							.toLowerCase()
							.includes(searchTerm.toLowerCase());
					} else if (selectedOption === '태그') {
						return recipe.recipe_tags.some((tag) =>
							tag.toLowerCase().includes(searchTerm.toLowerCase())
						);
					} else if (selectedOption === '재료') {
						return recipe.recipe_ingredients.some((ingredient) =>
							ingredient.name.toLowerCase().includes(searchTerm.toLowerCase())
						);
					}
					return false;
				});
				setCurrentPage(1);
			} else {
				// 검색어가 없을 경우 전체 레시피 사용
				filteredRecipes = allRecipes;
			}

			// 정렬된 레시피 목록을 갱신 (최신순으로 정렬)
			const sortedRecipes = sortingRecipes(filteredRecipes, selectedSorting);

			// 페이지에 맞게 필터링된 레시피 가져오기
			const startIndex = (page - 1) * pageSize; // 시작 인덱스
			const paginatedRecipes = sortedRecipes.slice(
				startIndex,
				startIndex + pageSize
			);

			setRecipes(paginatedRecipes);
			setFilteredCount(filteredRecipes.length); // 필터링된 레시피 수 업데이트
			setCurrentPage(page); // 현재 페이지 설정

			// 검색 결과가 없을 때의 처리
			if (filteredRecipes.length === 0) {
			}
		} catch (error) {
			console.error('Error fetching recipes:', error);
		} finally {
			setLoading(false);
		}
	};

	// 페이지 변경 시 데이터를 다시 불러옴
	useEffect(() => {
		fetchRecipes(currentPage);
	}, [currentPage, searchTerm, selectedOption, selectedSorting]); // 정렬 기준도 포함
	// 검색어와 옵션이 변경될 때도 재호출

	// 검색어가 변경될 때 현재 페이지를 1로 설정
	useEffect(() => {
		setCurrentPage(1); // 검색어가 변경될 때 페이지를 1로 초기화
		fetchRecipes(1); // 초기 로드 시 첫 페이지의 데이터를 가져옴
	}, [searchTerm]); // 검색어가 변경될 때마다 호출

	const [isOpen, setIsOpen] = useState(false);
	const plusRef = useRef<HTMLUListElement>(null);
	const { user } = useAuth();
	const navigate = useNavigate();

	const handleOptionClick = (path: string) => {
		if (!user) {
			alert('로그인 하셔야합니다.');
			navigate('/login'); // 로그인되지 않았다면 로그인 페이지로 리다이렉트
		} else {
			navigate(path); // 로그인된 경우 해당 경로로 이동
		}
	};
	const currentUrl = window.location.href;

	useEffect(() => {
		if (currentUrl.includes('/recipelist')) {
			document.body.style.backgroundColor = '#fff9e9';
			document.body.style.marginTop = '200px';
		}

		const handleClickOutside = (event: MouseEvent) => {
			if (plusRef.current && !plusRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
			document.body.style.backgroundColor = '';
			document.body.style.marginTop = '';
		};
	}, []);

	const options = [
		{ label: '레시피 작성하기', path: '/create' },
		{ label: 'AI 추천 레시피(BETA)', path: '/recipe-ai' },
		{ label: '마이페이지', path: '/profile' },
	];

	const filterOptions = [
		{ label: '전체보기', value: '전체보기' },
		{ label: 'Lv 1', value: 1 },
		{ label: 'Lv 2', value: 2 },
		{ label: 'Lv 3', value: 3 },
	];

	// 상태 초기화: 전체보기로 기본값 설정
	const [selectedFilter, setSelectedFilter] = useState<string | number>(
		filterOptions[0].value
	);

	const handleFilterClick = (fOption: any) => {
		setSelectedFilter(fOption.value);
	};

	// 필터링된 레시피 생성
	const filteredRecipes = recipes.filter((recipe) => {
		if (selectedFilter === '전체보기') {
			return true;
		} else if (selectedFilter === recipe.recipe_difficulty) {
			return true;
		}
		return false;
	});

	const toggleDropdown = () => {
		setIsDropdownOpen(!isDropdownOpen);
	};

	const handleSortingSelect = (value: string) => {
		setSelectedSorting(value); // 선택된 정렬 기준 설정

		// 정렬된 레시피 목록을 갱신
		const sorted = sortingRecipes(recipes, value);
		setRecipes([...sorted]); // 정렬된 레시피로 상태 업데이트

		setIsDropdownOpen(false); // 드롭다운 닫기
	};

	const sortingOptions = [
		{ value: 'latest', label: '최신글' },
		{ value: 'likes', label: '좋아요' },
		{ value: 'views', label: '조회수' },
	];

	const convertToDate = (recipeCreateTime: RecipeCreateTime): Date => {
		return new Date(
			recipeCreateTime.seconds * 1000 + recipeCreateTime.nanoseconds / 1000000
		);
	};

	// 정렬 함수
	const sortingRecipes = (recipes: Recipe[], sorting: string) => {
		switch (sorting) {
			case '최신글': // 최신글 기준 정렬
				return recipes.sort(
					(a, b) =>
						convertToDate(b.recipe_create_time).getTime() -
						convertToDate(a.recipe_create_time).getTime()
				);
			case '좋아요': // 좋아요 수 기준 정렬
				return recipes.sort((a, b) => b.hearts - a.hearts);
			case '조회수': // 조회수 기준 정렬
				return recipes.sort((a, b) => b.views - a.views);
			default: // 기본값은 최신글
				return recipes.sort(
					(a, b) =>
						convertToDate(b.recipe_create_time).getTime() -
						convertToDate(a.recipe_create_time).getTime()
				);
		}
	};

	const recipeListRef = useRef<HTMLDivElement>(null);

	const handlePageClick = (page: number) => {
		setCurrentPage(page);
		if (recipeListRef.current) {
			const { top } = recipeListRef.current.getBoundingClientRect();
			const offset = 200;

			window.scrollTo({
				top: top + window.scrollY - offset,
				behavior: 'smooth',
			});
		}
	};

	return (
		<div ref={recipeListRef}>
			<div className={styles.recipeListHeader}>
				<div className={styles.filterBtnWrapper}>
					{filterOptions.map((fOption) => (
						<CustomButton
							btnType={ButtonType.Filter}
							shape="rad30"
							color={selectedFilter === fOption.value ? 'orange' : 'white'}
							onClick={() => handleFilterClick(fOption)}
							key={fOption.value}
						>
							{fOption.label}
						</CustomButton>
					))}
				</div>
				<button
					type="button"
					className={styles.sortingDropdown}
					onClick={toggleDropdown}
				>
					<div
						className={`${styles.sortingDropdownSelected} ${isDropdownOpen ? styles.open : ''}`}
					>
						{selectedSorting}
					</div>
					{isDropdownOpen && (
						<ul className={styles.sortingDropdownOptions}>
							{sortingOptions.map((option) => (
								<li
									key={option.value}
									className={styles.sortingDropdownOption}
									onClick={() => handleSortingSelect(option.label)}
								>
									{option.label}
								</li>
							))}
						</ul>
					)}
				</button>
			</div>
			{loading ? (
				<div className={styles.loading}>로딩 중...</div>
			) : (
				<>
					{filteredRecipes.length > 0 ? (
						<div className={styles.recipeGrid}>
							{filteredRecipes.map((recipe) => (
								<RecipeCard key={recipe.id} recipe={recipe} />
							))}
						</div>
					) : (
						<div className={styles.notResult}>검색 결과가 없습니다.</div>
					)}
				</>
			)}
			<Pagination
				className={styles.pagination}
				current={currentPage}
				pageSize={pageSize}
				total={filteredCount} // 전체 필터링된 레시피 수
				onChange={handlePageClick} // 페이지 변경 시 현재 페이지 업데이트
			/>
			<PlusMenuBtn isOpen={isOpen} onClick={() => setIsOpen(!isOpen)} />
			{isOpen && (
				<ul className={styles.plusMenu} ref={plusRef}>
					{/* 각 옵션을 Link로 감싸 경로를 추가 */}
					{options.map((option) => (
						<li key={option.label}>
							<span
								className={styles.plusMenuList}
								onClick={() => handleOptionClick(option.path)}
							>
								{option.label}
							</span>
						</li>
					))}
				</ul>
			)}
		</div>
	);
};

export default RecipeList;
