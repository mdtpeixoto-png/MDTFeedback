async function run() {
  try {
    const res = await fetch("https://fafalabs.com.br/api/v1/make_sales.php?token=pp3lP4jqgzA8QLP6hw&limit=5");
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (e) {
    console.error(e);
  }
}
run();
